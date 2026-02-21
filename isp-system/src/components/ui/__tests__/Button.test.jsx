import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Button from '../Button';

describe('UI Component: Button', () => {
    it('renderiza con el texto proporcionado', () => {
        render(<Button>Click me</Button>);
        expect(screen.getByText('Click me')).toBeInTheDocument();
    });

    it('llama a la función onClick cuando se le hace clic', () => {
        const handleClick = vi.fn();
        render(<Button onClick={handleClick}>Submit</Button>);

        fireEvent.click(screen.getByText('Submit'));
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('deshabilita el botón si la prop disabled es true', () => {
        const handleClick = vi.fn();
        render(<Button disabled onClick={handleClick}>Submit</Button>);

        const button = screen.getByText('Submit');
        expect(button).toBeDisabled();

        fireEvent.click(button);
        expect(handleClick).not.toHaveBeenCalled();
    });

    it('muestra el spinner si isLoading es true y deshabilita el click', () => {
        const handleClick = vi.fn();
        const { container } = render(<Button isLoading onClick={handleClick}>LoadingText</Button>);

        const button = screen.getByText('LoadingText');
        expect(button).toBeDisabled();

        // Verifica que la clase animate-spin (de lucide-react loader) esté presente
        const spinner = container.querySelector('.animate-spin');
        expect(spinner).toBeInTheDocument();

        fireEvent.click(button);
        expect(handleClick).not.toHaveBeenCalled();
    });

    it('aplica las clases correctas según la prop variant', () => {
        render(<Button variant="danger">Delete</Button>);
        const button = screen.getByText('Delete');
        expect(button).toHaveClass('bg-red-500/10');
    });
});
