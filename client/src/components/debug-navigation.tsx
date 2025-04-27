import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function DebugNavigation() {
  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href="/project-debug">Projekte Debug</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/customer-debug">Kunden Debug</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/company-debug">Unternehmen Debug</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/attachment-debug">Anhänge Debug</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/construction-diary-debug">Bautagebuch Debug</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/db-structure-quality-debug">DB-Struktur Qualität</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}