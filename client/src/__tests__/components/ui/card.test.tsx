import React from 'react';
import { render, screen } from '../../test-utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

describe('Card Component', () => {
  it('rendert einen Card mit Header, Content und Footer', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Testtitel</CardTitle>
          <CardDescription>Testbeschreibung</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Testinhalt</p>
        </CardContent>
        <CardFooter>
          <p>Testfooter</p>
        </CardFooter>
      </Card>
    );
    
    // Überprüfen, ob alle Komponenten gerendert wurden
    expect(screen.getByText('Testtitel')).toBeInTheDocument();
    expect(screen.getByText('Testbeschreibung')).toBeInTheDocument();
    expect(screen.getByText('Testinhalt')).toBeInTheDocument();
    expect(screen.getByText('Testfooter')).toBeInTheDocument();
  });

  it('rendert einen Card mit benutzerdefinierten Klassen', () => {
    render(
      <Card className="test-card-class">
        <CardHeader className="test-header-class">
          <CardTitle className="test-title-class">Testtitel</CardTitle>
        </CardHeader>
        <CardContent className="test-content-class">
          <p>Testinhalt</p>
        </CardContent>
      </Card>
    );
    
    // Container-Element der Card finden
    const cardElement = screen.getByText('Testtitel').closest('.test-card-class');
    expect(cardElement).toHaveClass('test-card-class');
    
    // Header-Element finden
    const headerElement = screen.getByText('Testtitel').closest('.test-header-class');
    expect(headerElement).toHaveClass('test-header-class');
    
    // Title-Element finden
    expect(screen.getByText('Testtitel')).toHaveClass('test-title-class');
    
    // Content-Element finden
    const contentElement = screen.getByText('Testinhalt').closest('.test-content-class');
    expect(contentElement).toHaveClass('test-content-class');
  });

  it('rendert einen Card ohne Header oder Footer', () => {
    render(
      <Card>
        <CardContent>
          <p>Nur Inhalt</p>
        </CardContent>
      </Card>
    );
    
    expect(screen.getByText('Nur Inhalt')).toBeInTheDocument();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });
});