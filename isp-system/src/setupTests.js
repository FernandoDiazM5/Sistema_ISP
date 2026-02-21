import '@testing-library/jest-dom';

// Configuraciones globales para mocks que usa el proyecto
class MockIntersectionObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
}
window.IntersectionObserver = MockIntersectionObserver;
