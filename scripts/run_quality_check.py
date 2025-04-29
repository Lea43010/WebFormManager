#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Datenqualitätsprüfung für Bau-Structura
---------------------------------------

Dieses Skript führt Datenqualitätsprüfungen für die Bau-Structura-Datenbank durch.
Es erstellt Datenprofile, identifiziert Ausreißer und validiert Daten gegen Erwartungen.

Verwendung:
    python run_quality_check.py [--table TABELLE] [--profile] [--outliers] [--validate]
"""

import os
import sys
import argparse
import json
from datetime import datetime
from pathlib import Path
from data_quality import (
    get_db_connection, get_table_list, table_to_dataframe,
    profil_erstellen, erstelle_expectations_suite, 
    teste_daten_gegen_erwartungen, identifiziere_ausreisser
)

# Konfiguration
REPORT_DIR = Path("./data_quality_reports")
REPORT_DIR.mkdir(exist_ok=True)

def main():
    parser = argparse.ArgumentParser(description='Datenqualitätsprüfung für Bau-Structura')
    parser.add_argument('--table', help='Zu prüfende Tabelle (leer für alle)')
    parser.add_argument('--profile', action='store_true', help='Datenprofile erstellen')
    parser.add_argument('--outliers', action='store_true', help='Ausreißeranalyse durchführen')
    parser.add_argument('--validate', action='store_true', help='Daten gegen Erwartungen validieren')
    parser.add_argument('--limit', type=int, default=None, help='Maximale Anzahl der zu ladenden Zeilen')
    
    args = parser.parse_args()
    
    # Wenn keine spezifische Aktion ausgewählt wurde, alle durchführen
    if not (args.profile or args.outliers or args.validate):
        args.profile = True
        args.outliers = True
        args.validate = True
    
    print("=== Bau-Structura Datenqualitätsprüfung ===")
    print(f"Zeitstempel: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Datenbankverbindung herstellen
    engine = get_db_connection()
    
    # Tabellen auswählen
    if args.table:
        tables = [args.table]
    else:
        tables = get_table_list(engine)
        print(f"Gefundene Tabellen: {len(tables)}")
        for i, table in enumerate(tables, 1):
            print(f"  {i}. {table}")
        print()
    
    summary = {"timestamp": datetime.now().isoformat(), "tables": {}}
    
    # Prüfungen für jede Tabelle durchführen
    for table in tables:
        print(f"=== Prüfe Tabelle: {table} ===")
        summary["tables"][table] = {}
        
        try:
            # Daten laden
            df = table_to_dataframe(engine, table, limit=args.limit)
            print(f"Daten geladen: {df.shape[0]} Zeilen, {df.shape[1]} Spalten")
            
            # Datenprofil erstellen
            if args.profile:
                print("\n--- Erstelle Datenprofil ---")
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                profile_file = f"profil_{table}_{timestamp}.html"
                profile_path = REPORT_DIR / profile_file
                
                profile = profil_erstellen(df, str(profile_path), f"Datenprofil für {table}")
                print(f"Datenprofil erstellt: {profile_path}")
                
                # Speichere Profil-Metadaten in der Zusammenfassung
                summary["tables"][table]["profile"] = {
                    "file": str(profile_path),
                    "variables": df.shape[1],
                    "observations": df.shape[0],
                    "missing_cells": profile.get_description()["table"]["n_cells_missing"],
                    "missing_percent": profile.get_description()["table"]["p_cells_missing"]
                }
            
            # Ausreißeranalyse für numerische Spalten
            if args.outliers:
                print("\n--- Führe Ausreißeranalyse durch ---")
                numeric_columns = df.select_dtypes(include=['number']).columns
                
                if len(numeric_columns) == 0:
                    print("Keine numerischen Spalten für Ausreißeranalyse gefunden.")
                    summary["tables"][table]["outliers"] = {"status": "no_numeric_columns"}
                else:
                    outlier_results = {}
                    
                    for column in numeric_columns:
                        if df[column].nunique() <= 2:  # Überspringe binäre Spalten
                            continue
                            
                        print(f"\nAnalysiere Ausreißer in Spalte: {column}")
                        try:
                            ausreisser, grenzen, fig = identifiziere_ausreisser(df, column, methode='iqr')
                            
                            # Speichere Grafik
                            fig_file = f"ausreisser_{table}_{column}_{timestamp}.png"
                            fig_path = REPORT_DIR / fig_file
                            fig.savefig(fig_path)
                            print(f"  • Ausreißergrafik gespeichert: {fig_path}")
                            
                            # Speichere Ergebnisse
                            outlier_count = len(ausreisser)
                            outlier_percent = outlier_count / df.shape[0] * 100
                            print(f"  • Gefundene Ausreißer: {outlier_count} ({outlier_percent:.2f}%)")
                            print(f"  • Grenzen: Untere = {grenzen['lower']:.2f}, Obere = {grenzen['upper']:.2f}")
                            
                            outlier_results[column] = {
                                "count": outlier_count,
                                "percent": outlier_percent,
                                "bounds": grenzen,
                                "chart": str(fig_path)
                            }
                        except Exception as e:
                            print(f"  • Fehler bei Ausreißeranalyse: {e}")
                            outlier_results[column] = {"error": str(e)}
                    
                    summary["tables"][table]["outliers"] = outlier_results
            
            # Datenvalidierung mit automatisch erstellten Erwartungen
            if args.validate:
                print("\n--- Validiere Daten gegen Erwartungen ---")
                
                # Erwartungssuite erstellen
                suite_name = f"{table}_suite_{timestamp}"
                suite = erstelle_expectations_suite(df, suite_name=suite_name)
                
                # Erwartungssuite speichern
                suite_file = f"erwartungen_{table}_{timestamp}.json"
                suite_path = REPORT_DIR / suite_file
                
                with open(suite_path, 'w') as f:
                    json.dump(suite.to_json_dict(), f, indent=2)
                print(f"Erwartungssuite gespeichert: {suite_path}")
                
                # Daten validieren
                result = teste_daten_gegen_erwartungen(df, suite)
                
                # Ergebnisse speichern
                result_file = f"validierung_{table}_{timestamp}.json"
                result_path = REPORT_DIR / result_file
                
                with open(result_path, 'w') as f:
                    json.dump(result.to_json_dict(), f, indent=2)
                print(f"Validierungsergebnis gespeichert: {result_path}")
                
                # Erfolgsrate berechnen
                success_rate = result.statistics['successful_expectations'] / result.statistics['evaluated_expectations']
                success_percent = success_rate * 100
                print(f"Erfolgsrate: {success_rate:.2%} ({result.statistics['successful_expectations']} von {result.statistics['evaluated_expectations']} Tests bestanden)")
                
                summary["tables"][table]["validation"] = {
                    "expectations_file": str(suite_path),
                    "result_file": str(result_path),
                    "success_rate": success_rate,
                    "success_percent": success_percent,
                    "total_expectations": result.statistics['evaluated_expectations'],
                    "successful_expectations": result.statistics['successful_expectations']
                }
            
            print("\n--- Prüfung abgeschlossen ---")
            
        except Exception as e:
            print(f"Fehler bei der Prüfung von {table}: {e}")
            summary["tables"][table]["error"] = str(e)
        
        print()
    
    # Gesamtzusammenfassung speichern
    summary_file = f"qualitaetspruefung_zusammenfassung_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    summary_path = REPORT_DIR / summary_file
    
    with open(summary_path, 'w') as f:
        json.dump(summary, f, indent=2)
    
    print(f"=== Zusammenfassung der Datenqualitätsprüfung wurde gespeichert: {summary_path} ===")

if __name__ == "__main__":
    main()