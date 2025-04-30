import React from 'react';
import { render, screen, fireEvent } from '../../test-utils';
import { Button } from '@/components/ui/button';

describe('Button Component', () => {
  it('rendert einen Button mit dem angegebenen Text', () => {
    render(<Button>Klick mich</Button>);
    expect(screen.getByRole('button', { name: /klick mich/i })).toBeInTheDocument();
  });

  it('rendert einen Button mit der angegebenen Variante', () => {
    render(<Button variant="destructive">Löschen</Button>);
    const button = screen.getByRole('button', { name: /löschen/i });
    expect(button).toHaveClass('bg-destructive');
  });

  it('rendert einen Button mit der angegebenen Größe', () => {
    render(<Button size="sm">Klein</Button>);
    const button = screen.getByRole('button', { name: /klein/i });
    expect(button).toHaveClass('h-9');
  });

  it('löst onClick aus, wenn geklickt wird', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Klicken</Button>);
    
    fireEvent.click(screen.getByRole('button', { name: /klicken/i }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('rendert einen deaktivierten Button, wenn disabled=true', () => {
    render(<Button disabled>Deaktiviert</Button>);
    
    const button = screen.getByRole('button', { name: /deaktiviert/i });
    expect(button).toBeDisabled();
  });

  it('rendert einen Button mit asChild ohne button HTML-Element', () => {
    render(
      <Button asChild>
        <a href="#">Link Button</a>
      </Button>
    );
    
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /link button/i })).toBeInTheDocument();
  });
});