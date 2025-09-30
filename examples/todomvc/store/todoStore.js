/**
 * Todo Store - State management for TodoMVC
 */

import { StateManager } from '../../../src/core/state-manager.js';

// Todo actions
export const TODO_ACTIONS = {
    ADD_TODO: 'ADD_TODO',
    TOGGLE_TODO: 'TOGGLE_TODO',
    DELETE_TODO: 'DELETE_TODO',
    EDIT_TODO: 'EDIT_TODO',
    TOGGLE_ALL: 'TOGGLE_ALL',
    CLEAR_COMPLETED: 'CLEAR_COMPLETED',
    SET_FILTER: 'SET_FILTER'
};

// Reducer functions
const todoReducers = {
    [TODO_ACTIONS.ADD_TODO]: (state, action) => {
        const newTodo = {
            id: Date.now() + Math.random(), // Simple ID generation
            text: action.payload.text.trim(),
            completed: false,
            createdAt: Date.now()
        };

        return {
            ...state,
            todos: [...state.todos, newTodo]
        };
    },

    [TODO_ACTIONS.TOGGLE_TODO]: (state, action) => {
        return {
            ...state,
            todos: state.todos.map(todo =>
                todo.id === action.payload.id
                    ? { ...todo, completed: !todo.completed }
                    : todo
            )
        };
    },

    [TODO_ACTIONS.DELETE_TODO]: (state, action) => {
        return {
            ...state,
            todos: state.todos.filter(todo => todo.id !== action.payload.id)
        };
    },

    [TODO_ACTIONS.EDIT_TODO]: (state, action) => {
        return {
            ...state,
            todos: state.todos.map(todo =>
                todo.id === action.payload.id
                    ? { ...todo, text: action.payload.text.trim() }
                    : todo
            )
        };
    },

    [TODO_ACTIONS.TOGGLE_ALL]: (state, action) => {
        const allCompleted = state.todos.every(todo => todo.completed);
        return {
            ...state,
            todos: state.todos.map(todo => ({
                ...todo,
                completed: !allCompleted
            }))
        };
    },

    [TODO_ACTIONS.CLEAR_COMPLETED]: (state) => {
        return {
            ...state,
            todos: state.todos.filter(todo => !todo.completed)
        };
    },

    [TODO_ACTIONS.SET_FILTER]: (state, action) => {
        return {
            ...state,
            filter: action.payload.filter
        };
    }
};

// Selectors
export const selectors = {
    getAllTodos: (state) => state.todos,

    getActiveTodos: (state) => state.todos.filter(todo => !todo.completed),

    getCompletedTodos: (state) => state.todos.filter(todo => todo.completed),

    getFilteredTodos: (state) => {
        const { todos, filter } = state;
        switch (filter) {
            case 'active':
                return todos.filter(todo => !todo.completed);
            case 'completed':
                return todos.filter(todo => todo.completed);
            default:
                return todos;
        }
    },

    getActiveCount: (state) => state.todos.filter(todo => !todo.completed).length,

    getCompletedCount: (state) => state.todos.filter(todo => todo.completed).length,

    hasCompletedTodos: (state) => state.todos.some(todo => todo.completed),

    getCurrentFilter: (state) => state.filter,

    areAllCompleted: (state) => state.todos.length > 0 && state.todos.every(todo => todo.completed)
};

// Action creators
export const actions = {
    addTodo: (text) => ({
        type: TODO_ACTIONS.ADD_TODO,
        payload: { text }
    }),

    toggleTodo: (id) => ({
        type: TODO_ACTIONS.TOGGLE_TODO,
        payload: { id }
    }),

    deleteTodo: (id) => ({
        type: TODO_ACTIONS.DELETE_TODO,
        payload: { id }
    }),

    editTodo: (id, text) => ({
        type: TODO_ACTIONS.EDIT_TODO,
        payload: { id, text }
    }),

    toggleAll: () => ({
        type: TODO_ACTIONS.TOGGLE_ALL
    }),

    clearCompleted: () => ({
        type: TODO_ACTIONS.CLEAR_COMPLETED
    }),

    setFilter: (filter) => ({
        type: TODO_ACTIONS.SET_FILTER,
        payload: { filter }
    })
};

// Store factory
export function createTodoStore() {
    const stateManager = new StateManager();

    // Load persisted state or use default
    const initialState = StateManager.loadPersistedState('todomvc-state', {
        todos: [],
        filter: 'all'
    });

    const store = stateManager.createStore(initialState, todoReducers);

    // Add persistence middleware
    store.addMiddleware(StateManager.createPersistenceMiddleware('todomvc-state'));

    // Add logger in development
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        store.addMiddleware(StateManager.createLoggerMiddleware());
    }

    // Add helper methods for easier usage
    store.selectors = selectors;
    store.actions = actions;

    return store;
}