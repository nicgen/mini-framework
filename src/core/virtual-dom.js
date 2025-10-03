/**
 * Virtual DOM implementation
 * Handles element creation, diffing, and rendering
 */

class VNode {
    constructor(tag, props = {}, children = []) {
        this.tag = tag;
        this.props = props;
        this.children = Array.isArray(children) ? children : [children];
        this.key = props.key || null;
        this.element = null; // Reference to actual DOM element
    }
}

export class VirtualDOM {
    constructor(eventSystem = null) {
        this.containerTrees = new Map(); // Track trees per container
        this.eventSystem = eventSystem; // Reference to EventSystem for cleanup
        this.elementEventHandlers = new Map(); // Track event handlers per element for cleanup
        this.lifecycleHooks = new Map(); // Track lifecycle hooks per element
    }

    createElement(tag, props = {}, ...children) {
        // Handle text nodes
        if (typeof tag === 'string' && arguments.length === 1) {
            return { type: 'text', value: tag };
        }

        // Flatten and process children
        const processedChildren = this.flattenChildren(children).map(child => {
            if (typeof child === 'string' || typeof child === 'number') {
                return { type: 'text', value: String(child) };
            }
            return child;
        });

        return new VNode(tag, props, processedChildren);
    }

    flattenChildren(children) {
        const result = [];
        for (const child of children) {
            if (Array.isArray(child)) {
                result.push(...this.flattenChildren(child));
            } else if (child != null && child !== false && child !== undefined) {
                result.push(child);
            }
        }
        return result;
    }

    render(vnode, container) {
        const currentTree = this.containerTrees.get(container);

        if (currentTree) {
            // Update existing tree
            this.updateElement(container, vnode, currentTree);
        } else {
            // Initial render
            const element = this.createDOMElement(vnode);
            container.innerHTML = '';
            container.appendChild(element);
        }

        this.containerTrees.set(container, vnode);
        return container;
    }

    createDOMElement(vnode) {
        // Handle text nodes
        if (vnode.type === 'text') {
            return document.createTextNode(vnode.value);
        }

        // Create element
        const element = document.createElement(vnode.tag);
        vnode.element = element;

        // Set properties
        this.setProps(element, vnode.props);

        // Call onMount lifecycle hook if provided
        if (vnode.props.onMount && typeof vnode.props.onMount === 'function') {
            this.lifecycleHooks.set(element, { onMount: vnode.props.onMount, onUnmount: vnode.props.onUnmount });
            // Execute onMount after element is fully created
            Promise.resolve().then(() => vnode.props.onMount(element));
        }

        // Add children
        vnode.children.forEach(child => {
            const childElement = this.createDOMElement(child);
            element.appendChild(childElement);
        });

        return element;
    }

    /**
     * Cleanup element and its children - prevents memory leaks
     * @param {Element} element - DOM element to cleanup
     */
    cleanupElement(element) {
        if (!element) return;

        // Call onUnmount lifecycle hook
        const hooks = this.lifecycleHooks.get(element);
        if (hooks && hooks.onUnmount && typeof hooks.onUnmount === 'function') {
            hooks.onUnmount(element);
        }
        this.lifecycleHooks.delete(element);

        // Clean up event handlers if EventSystem is available
        if (this.eventSystem) {
            this.eventSystem.off(element);
        }

        // Clean up tracked event handlers
        this.elementEventHandlers.delete(element);

        // Recursively cleanup children
        if (element.childNodes) {
            Array.from(element.childNodes).forEach(child => {
                if (child.nodeType === 1) { // Element node
                    this.cleanupElement(child);
                }
            });
        }
    }

    setProps(element, props) {
        Object.entries(props).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'style' && typeof value === 'object') {
                Object.assign(element.style, value);
            } else if (key.startsWith('on') && typeof value === 'function') {
                // Handle event props using EventSystem if available
                const eventType = key.slice(2).toLowerCase(); // onClick -> click, onDblClick -> dblclick

                if (this.eventSystem) {
                    // Use custom EventSystem
                    const unsubscribe = this.eventSystem.on(element, eventType, value);

                    // Track unsubscribe function for cleanup
                    if (!this.elementEventHandlers.has(element)) {
                        this.elementEventHandlers.set(element, []);
                    }
                    this.elementEventHandlers.get(element).push({ eventType, handler: value, unsubscribe });
                } else {
                    // Fallback to native addEventListener if EventSystem not available
                    element.addEventListener(eventType, value);
                }
            } else if (key.startsWith('data-') || key.startsWith('aria-')) {
                element.setAttribute(key, value);
            } else if (key === 'autofocus' || key === 'autoFocus') {
                // Handle autofocus properly
                if (value) {
                    element.setAttribute('autofocus', '');
                    // Also set focus programmatically
                    setTimeout(() => element.focus(), 0);
                }
            } else if (key === 'htmlFor') {
                element.setAttribute('for', value);
            } else if (key === 'onMount' || key === 'onUnmount') {
                // Lifecycle hooks are handled separately, skip them here
                return;
            } else if (key !== 'key' && key !== 'children') {
                // Special handling for checkbox/radio 'checked' and 'value' properties
                if (key === 'checked' || key === 'value' || key === 'selected') {
                    element[key] = value;
                }
                // Handle boolean attributes
                else if (typeof value === 'boolean') {
                    if (value) {
                        element.setAttribute(key, '');
                    } else {
                        element.removeAttribute(key);
                    }
                } else if (key in element) {
                    element[key] = value;
                } else {
                    element.setAttribute(key, value);
                }
            }
        });
    }

    /**
     * Key-based reconciliation for better performance with dynamic lists
     * @param {Element} parent - Parent DOM element
     * @param {Array} newChildren - New virtual children
     * @param {Array} oldChildren - Old virtual children
     */
    reconcileChildren(parent, newChildren, oldChildren) {
        // Check if we should use key-based reconciliation
        // Check BOTH new and old children for keys (important when filtering to empty list!)
        const hasKeys = newChildren.some(child => child && child.key != null) ||
                        oldChildren.some(child => child && child.key != null);

        if (hasKeys) {
            this.reconcileChildrenWithKeys(parent, newChildren, oldChildren);
        } else {
            this.reconcileChildrenByIndex(parent, newChildren, oldChildren);
        }
    }

    /**
     * O(n) key-based reconciliation algorithm
     */
    reconcileChildrenWithKeys(parent, newChildren, oldChildren) {
        const oldKeyMap = new Map();
        const oldDomMap = new Map();

        // Build a map from keys to DOM elements by looking at actual DOM
        // We'll look for data-id attributes or use the order as fallback
        const domElements = Array.from(parent.childNodes).filter(node => node.nodeType === 1);

        // Build maps of old children VNodes
        oldChildren.forEach((child) => {
            if (child && child.key != null) {
                oldKeyMap.set(child.key, child);
            }
        });

        // Try to map keys to actual DOM elements
        // Strategy 1: Use data-id attribute if it matches the key
        domElements.forEach(domElement => {
            const dataId = domElement.getAttribute('data-id');
            if (dataId) {
                const parsedKey = parseFloat(dataId);
                if (oldKeyMap.has(parsedKey)) {
                    oldDomMap.set(parsedKey, domElement);
                }
            }
        });

        // Strategy 2: If keys didn't map via data-id, use order
        // This assumes oldChildren order matches DOM order (which should be true after first render)
        if (oldDomMap.size === 0 && oldChildren.length === domElements.length) {
            oldChildren.forEach((child, index) => {
                if (child && child.key != null && domElements[index]) {
                    oldDomMap.set(child.key, domElements[index]);
                }
            });
        }

        const newKeySet = new Set();
        const processedNodes = [];

        // Process new children - create or update nodes
        newChildren.forEach((newChild) => {
            if (!newChild) return;

            const key = newChild.key;
            newKeySet.add(key);

            const oldChild = oldKeyMap.get(key);
            const oldDomNode = oldDomMap.get(key);

            if (oldChild && oldDomNode) {
                // Existing child - update it
                // Optimization: Skip updates if VNode references are identical (no changes)
                if (oldChild !== newChild) {
                    this.updateProps(oldDomNode, newChild.props, oldChild.props);
                    this.reconcileChildren(oldDomNode, newChild.children, oldChild.children);
                }
                processedNodes.push(oldDomNode);
            } else {
                // New child - create it
                const element = this.createDOMElement(newChild);
                processedNodes.push(element);
            }
        });

        // Remove old children that are no longer present
        oldChildren.forEach((oldChild) => {
            if (oldChild && oldChild.key != null && !newKeySet.has(oldChild.key)) {
                const domNode = oldDomMap.get(oldChild.key);
                if (domNode && domNode.parentNode === parent) {
                    this.cleanupElement(domNode);
                    parent.removeChild(domNode);
                }
            }
        });

        // Reorder/insert nodes to match new order
        processedNodes.forEach((node, index) => {
            const currentNode = parent.childNodes[index];
            if (currentNode !== node) {
                if (node.parentNode === parent) {
                    // Node exists in parent but in wrong position - move it
                    parent.insertBefore(node, currentNode || null);
                } else {
                    // Node is new - insert it
                    parent.insertBefore(node, currentNode || null);
                }
            }
        });
    }

    /**
     * Index-based reconciliation (fallback when no keys)
     */
    reconcileChildrenByIndex(parent, newChildren, oldChildren) {
        const maxLength = Math.max(newChildren.length, oldChildren.length);

        for (let i = 0; i < maxLength; i++) {
            this.updateElement(parent, newChildren[i], oldChildren[i], i);
        }
    }

    updateElement(parent, newNode, oldNode, index = 0) {
        // Node was removed
        if (!newNode) {
            if (parent.childNodes[index]) {
                const node = parent.childNodes[index];
                this.cleanupElement(node);
                parent.removeChild(node);
            }
            return;
        }

        // Node was added
        if (!oldNode) {
            const element = this.createDOMElement(newNode);
            if (parent.childNodes[index]) {
                parent.insertBefore(element, parent.childNodes[index]);
            } else {
                parent.appendChild(element);
            }
            return;
        }

        // Node was replaced
        if (this.hasNodeChanged(newNode, oldNode)) {
            const oldElement = parent.childNodes[index];
            if (oldElement) {
                this.cleanupElement(oldElement);
                parent.replaceChild(
                    this.createDOMElement(newNode),
                    oldElement
                );
            } else {
                parent.appendChild(this.createDOMElement(newNode));
            }
            return;
        }

        // Text nodes
        if (newNode.type === 'text') {
            if (newNode.value !== oldNode.value && parent.childNodes[index]) {
                parent.childNodes[index].textContent = newNode.value;
            }
            return;
        }

        // Update props
        const element = parent.childNodes[index];
        if (element) {
            this.updateProps(element, newNode.props, oldNode.props);

            // Update children using reconciliation
            this.reconcileChildren(element, newNode.children, oldNode.children);
        }
    }

    hasNodeChanged(node1, node2) {
        return (
            typeof node1 !== typeof node2 ||
            (typeof node1 === 'string' && node1 !== node2) ||
            node1.type !== node2.type ||
            node1.tag !== node2.tag ||
            node1.key !== node2.key
        );
    }

    updateProps(element, newProps, oldProps) {
        // Remove old props
        Object.keys(oldProps).forEach(key => {
            if (!(key in newProps)) {
                if (key === 'className') {
                    element.className = '';
                } else if (key === 'style') {
                    element.style.cssText = '';
                } else if (key.startsWith('on') && typeof oldProps[key] === 'function') {
                    // Remove old event listener
                    const eventType = key.slice(2).toLowerCase();

                    if (this.eventSystem) {
                        // Using EventSystem - handlers are tracked and cleaned up
                        const handlers = this.elementEventHandlers.get(element);
                        if (handlers) {
                            const handlerEntry = handlers.find(h => h.eventType === eventType && h.handler === oldProps[key]);
                            if (handlerEntry && handlerEntry.unsubscribe) {
                                handlerEntry.unsubscribe();
                                const index = handlers.indexOf(handlerEntry);
                                if (index > -1) handlers.splice(index, 1);
                            }
                        }
                    } else {
                        // Fallback to native removeEventListener
                        element.removeEventListener(eventType, oldProps[key]);
                    }
                } else if (key !== 'key' && key !== 'onMount' && key !== 'onUnmount') {
                    element.removeAttribute(key);
                }
            }
        });

        // Update changed props
        Object.entries(newProps).forEach(([key, newValue]) => {
            const oldValue = oldProps[key];
            if (oldValue !== newValue) {
                if (key.startsWith('on') && typeof oldValue === 'function') {
                    // Remove old event listener
                    const eventType = key.slice(2).toLowerCase();

                    if (this.eventSystem) {
                        const handlers = this.elementEventHandlers.get(element);
                        if (handlers) {
                            const handlerEntry = handlers.find(h => h.eventType === eventType && h.handler === oldValue);
                            if (handlerEntry && handlerEntry.unsubscribe) {
                                handlerEntry.unsubscribe();
                                const index = handlers.indexOf(handlerEntry);
                                if (index > -1) handlers.splice(index, 1);
                            }
                        }
                    } else {
                        element.removeEventListener(eventType, oldValue);
                    }
                }

                // Set new prop (including new event listener)
                if (key === 'className') {
                    element.className = newValue;
                } else if (key === 'style' && typeof newValue === 'object') {
                    Object.assign(element.style, newValue);
                } else if (key.startsWith('on') && typeof newValue === 'function') {
                    const eventType = key.slice(2).toLowerCase();

                    if (this.eventSystem) {
                        const unsubscribe = this.eventSystem.on(element, eventType, newValue);

                        if (!this.elementEventHandlers.has(element)) {
                            this.elementEventHandlers.set(element, []);
                        }
                        this.elementEventHandlers.get(element).push({ eventType, handler: newValue, unsubscribe });
                    } else {
                        element.addEventListener(eventType, newValue);
                    }
                } else if (key.startsWith('data-') || key.startsWith('aria-')) {
                    element.setAttribute(key, newValue);
                } else if (key === 'autofocus' || key === 'autoFocus') {
                    // Handle autofocus properly
                    if (newValue) {
                        element.setAttribute('autofocus', '');
                        setTimeout(() => element.focus(), 0);
                    } else {
                        element.removeAttribute('autofocus');
                    }
                } else if (key === 'htmlFor') {
                    element.setAttribute('for', newValue);
                } else if (key === 'onMount' || key === 'onUnmount') {
                    // Lifecycle hooks - update them
                    const hooks = this.lifecycleHooks.get(element) || {};
                    hooks[key] = newValue;
                    this.lifecycleHooks.set(element, hooks);
                } else if (key !== 'key' && key !== 'children') {
                    // Special handling for checkbox/radio 'checked' and 'value' properties
                    if (key === 'checked' || key === 'value' || key === 'selected') {
                        element[key] = newValue;
                    }
                    // Handle boolean attributes
                    else if (typeof newValue === 'boolean') {
                        if (newValue) {
                            element.setAttribute(key, '');
                        } else {
                            element.removeAttribute(key);
                        }
                    } else if (key in element) {
                        element[key] = newValue;
                    } else {
                        element.setAttribute(key, newValue);
                    }
                }
            }
        });
    }

    // Helper method for components
    fragment(...children) {
        return this.createElement('div', { style: { display: 'contents' } }, ...children);
    }
}