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
    constructor() {
        this.containerTrees = new Map(); // Track trees per container
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

        // Add children
        vnode.children.forEach(child => {
            const childElement = this.createDOMElement(child);
            element.appendChild(childElement);
        });

        return element;
    }

    setProps(element, props) {
        Object.entries(props).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'style' && typeof value === 'object') {
                Object.assign(element.style, value);
            } else if (key.startsWith('on') && typeof value === 'function') {
                // Handle event props like onClick, onKeydown, etc.
                const eventType = key.slice(2).toLowerCase(); // onClick -> click
                element.addEventListener(eventType, value);
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
            } else if (key !== 'key' && key !== 'children') {
                // Handle boolean attributes
                if (typeof value === 'boolean') {
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

    updateElement(parent, newNode, oldNode, index = 0) {
        // Node was removed
        if (!newNode) {
            if (parent.childNodes[index]) {
                parent.removeChild(parent.childNodes[index]);
            }
            return;
        }

        // Node was added
        if (!oldNode) {
            parent.appendChild(this.createDOMElement(newNode));
            return;
        }

        // Node was replaced
        if (this.hasNodeChanged(newNode, oldNode)) {
            if (parent.childNodes[index]) {
                parent.replaceChild(
                    this.createDOMElement(newNode),
                    parent.childNodes[index]
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

            // Update children
            const maxLength = Math.max(newNode.children.length, oldNode.children.length);
            for (let i = 0; i < maxLength; i++) {
                this.updateElement(
                    element,
                    newNode.children[i],
                    oldNode.children[i],
                    i
                );
            }
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
                    element.removeEventListener(eventType, oldProps[key]);
                } else if (key !== 'key') {
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
                    element.removeEventListener(eventType, oldValue);
                }
                // Set new prop (including new event listener)
                if (key === 'className') {
                    element.className = newValue;
                } else if (key === 'style' && typeof newValue === 'object') {
                    Object.assign(element.style, newValue);
                } else if (key.startsWith('on') && typeof newValue === 'function') {
                    const eventType = key.slice(2).toLowerCase();
                    element.addEventListener(eventType, newValue);
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
                } else if (key !== 'key' && key !== 'children') {
                    // Handle boolean attributes
                    if (typeof newValue === 'boolean') {
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