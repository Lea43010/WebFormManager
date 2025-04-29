#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Datenqualitätssystem für Bau-Structura
--------------------------------------

Dieses Modul bietet Funktionen zum Erstellen von Datenqualitätsprofilen,
zum Testen von Daten gegen Erwartungen und zum Identifizieren von Ausreißern.
Es verwendet ydata-profiling (ehemals pandas-profiling) für Datenprofile
und Great Expectations für Datenvalidierung.
"""

import os
import sys
import json
import logging
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Tuple, Any, Optional, Union

# Datenprofilierung
from ydata_profiling import ProfileReport

# Datenvalidierung mit Great Expectations
import great_expectations as ge
from great_expectations.dataset import PandasDataset

# SQLAlchemy für Datenbankverbindungen
from sqlalchemy import create_engine, inspect, text

# Logger konfigurieren
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('data_quality')

# Konfiguration
REPORT_DIR = Path("./data_quality_reports")
REPORT_DIR.mkdir(exist_ok=True)

def get_db_connection(db_url: Optional[str] = None) -> 'sqlalchemy.engine.Engine':
    """
    Stellt eine Verbindung zur Datenbank her.
    
    Args:
        db_url: Die Datenbank-URL. Wenn None, wird die Umgebungsvariable DATABASE_URL verwendet.
        
    Returns:
        SQLAlchemy Engine-Objekt
    """
    if db_url is None:
        db_url = os.getenv('DATABASE_URL', None)
        
    if db_url is None:
        raise ValueError("Keine Datenbank-URL angegeben. Bitte geben Sie eine URL an oder setzen Sie die Umgebungsvariable DATABASE_URL.")
    
    logger.info(f"Verbindung zur Datenbank wird hergestellt...")
    engine = create_engine(db_url)
    logger.info(f"Verbindung zur Datenbank hergestellt.")
    return engine

def get_table_list(engine: 'sqlalchemy.engine.Engine') -> List[str]:
    """
    Gibt eine Liste aller Tabellen in der Datenbank zurück.
    
    Args:
        engine: SQLAlchemy Engine-Objekt
        
    Returns:
        Liste der Tabellennamen
    """
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    return [t for t in tables if not t.startswith('pg_') and not t.startswith('sql_')]

def query_to_dataframe(engine: 'sqlalchemy.engine.Engine', query: str) -> pd.DataFrame:
    """
    Führt eine SQL-Abfrage aus und gibt das Ergebnis als DataFrame zurück.
    
    Args:
        engine: SQLAlchemy Engine-Objekt
        query: SQL-Abfrage
        
    Returns:
        DataFrame mit dem Ergebnis der Abfrage
    """
    logger.info(f"Führe Abfrage aus: {query[:100]}...")
    try:
        return pd.read_sql_query(query, engine)
    except Exception as e:
        logger.error(f"Fehler beim Ausführen der Abfrage: {e}")
        raise

def table_to_dataframe(engine: 'sqlalchemy.engine.Engine', table_name: str, limit: Optional[int] = None) -> pd.DataFrame:
    """
    Lädt eine Tabelle als DataFrame.
    
    Args:
        engine: SQLAlchemy Engine-Objekt
        table_name: Name der Tabelle
        limit: Maximale Anzahl der zu ladenden Zeilen (None für alle)
        
    Returns:
        DataFrame mit dem Inhalt der Tabelle
    """
    limit_clause = f" LIMIT {limit}" if limit is not None else ""
    query = f"SELECT * FROM {table_name}{limit_clause}"
    return query_to_dataframe(engine, query)

def profil_erstellen(df: pd.DataFrame, output_file: Optional[str] = None, 
                    title: str = "Datenprofilbericht", minimal: bool = False) -> ProfileReport:
    """
    Erstellt ein Datenprofil für einen DataFrame.
    
    Args:
        df: DataFrame mit den zu analysierenden Daten
        output_file: Pfad zur Ausgabedatei (HTML)
        title: Titel des Berichts
        minimal: Wenn True, wird ein minimal-Bericht erstellt (schneller)
        
    Returns:
        ProfileReport-Objekt
    """
    logger.info(f"Erstelle Datenprofil für DataFrame mit {df.shape[0]} Zeilen und {df.shape[1]} Spalten...")
    
    # Ersetze None-Werte in numerischen Spalten
    for col in df.select_dtypes(include=['number']).columns:
        df[col] = df[col].fillna(np.nan)
    
    # Erstelle das Profil
    if minimal:
        profile = ProfileReport(df, title=title, minimal=True)
    else:
        profile = ProfileReport(
            df, 
            title=title,
            explorative=True,
            correlations={
                "pearson": {"calculate": True},
                "spearman": {"calculate": True},
                "kendall": {"calculate": True},
                "phi_k": {"calculate": True},
            },
            missing_diagrams={
                "bar": True,
                "matrix": True,
                "heatmap": True,
            },
            interactions={
                "continuous": True,
            }
        )
    
    # Speichere den Bericht, wenn ein Ausgabepfad angegeben wurde
    if output_file:
        output_path = REPORT_DIR / output_file
        profile.to_file(output_path)
        logger.info(f"Datenprofil gespeichert unter: {output_path}")
    
    return profile

def tabellen_profilieren(engine: 'sqlalchemy.engine.Engine', table_names: Optional[List[str]] = None, 
                         limit: Optional[int] = None, output_dir: Optional[str] = None) -> Dict[str, str]:
    """
    Erstellt Datenprofile für mehrere Tabellen.
    
    Args:
        engine: SQLAlchemy Engine-Objekt
        table_names: Liste der zu profilierenden Tabellen (None für alle)
        limit: Maximale Anzahl der zu ladenden Zeilen pro Tabelle (None für alle)
        output_dir: Verzeichnis für die Ausgabedateien
        
    Returns:
        Dictionary mit Tabellennamen als Schlüssel und Pfaden zu den Berichten als Werte
    """
    if output_dir is None:
        output_dir = REPORT_DIR
    else:
        output_dir = Path(output_dir)
        output_dir.mkdir(exist_ok=True)
    
    if table_names is None:
        table_names = get_table_list(engine)
    
    report_paths = {}
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    for table in table_names:
        logger.info(f"Profiliere Tabelle: {table}")
        try:
            df = table_to_dataframe(engine, table, limit=limit)
            output_file = f"profil_{table}_{timestamp}.html"
            output_path = output_dir / output_file
            
            profile = profil_erstellen(
                df, 
                output_file=str(output_path),
                title=f"Datenprofil für {table}"
            )
            
            report_paths[table] = str(output_path)
            logger.info(f"Profil für {table} erstellt: {output_path}")
        except Exception as e:
            logger.error(f"Fehler beim Profilieren von {table}: {e}")
    
    return report_paths

# ---- Datenqualitätserwartungen mit Great Expectations ----

def erstelle_expectations_suite(df: pd.DataFrame, suite_name: str = "default_suite") -> ge.core.ExpectationSuite:
    """
    Erstellt automatisch eine Erwartungssuite basierend auf den Daten.
    
    Args:
        df: DataFrame mit den Daten
        suite_name: Name der Erwartungssuite
        
    Returns:
        ExpectationSuite-Objekt
    """
    ge_df = ge.from_pandas(df)
    suite = ge_df.create_expectation_suite(suite_name, overwrite_existing=True)
    
    # Automatische Erwartungen basierend auf Datentypen erstellen
    for column in df.columns:
        dtype = df[column].dtype
        
        # Grundlegende Erwartung: Keine NULL-Werte, wenn die Spalte keine enthält
        if df[column].isnull().sum() == 0:
            ge_df.expect_column_values_to_not_be_null(column)
        
        # Numerische Spalten
        if pd.api.types.is_numeric_dtype(dtype):
            min_val = df[column].min()
            max_val = df[column].max()
            ge_df.expect_column_values_to_be_between(column, min_val, max_val)
            
        # Kategorische Spalten
        elif pd.api.types.is_categorical_dtype(dtype) or df[column].nunique() < 20:
            value_set = df[column].dropna().unique().tolist()
            ge_df.expect_column_values_to_be_in_set(column, value_set)
            
        # Datum/Zeit-Spalten
        elif pd.api.types.is_datetime64_any_dtype(dtype):
            min_date = df[column].min()
            max_date = df[column].max()
            ge_df.expect_column_values_to_be_between(column, min_date, max_date)
    
    return suite

def speichere_expectations_suite(suite: ge.core.ExpectationSuite, datei_pfad: str) -> None:
    """
    Speichert eine Erwartungssuite in einer JSON-Datei.
    
    Args:
        suite: ExpectationSuite-Objekt
        datei_pfad: Pfad zur JSON-Datei
    """
    with open(datei_pfad, 'w') as f:
        json.dump(suite.to_json_dict(), f, indent=2)
    logger.info(f"Erwartungssuite gespeichert unter: {datei_pfad}")

def lade_expectations_suite(datei_pfad: str) -> ge.core.ExpectationSuite:
    """
    Lädt eine Erwartungssuite aus einer JSON-Datei.
    
    Args:
        datei_pfad: Pfad zur JSON-Datei
        
    Returns:
        ExpectationSuite-Objekt
    """
    with open(datei_pfad, 'r') as f:
        suite_dict = json.load(f)
    suite = ge.core.ExpectationSuite(**suite_dict)
    return suite

def teste_daten_gegen_erwartungen(df: pd.DataFrame, suite: ge.core.ExpectationSuite) -> ge.core.ExpectationValidationResult:
    """
    Testet Daten gegen eine Erwartungssuite.
    
    Args:
        df: DataFrame mit den zu testenden Daten
        suite: ExpectationSuite-Objekt
        
    Returns:
        ExpectationValidationResult-Objekt
    """
    ge_df = ge.from_pandas(df)
    result = ge_df.validate(expectation_suite=suite, only_return_failures=False)
    logger.info(f"Datenvalidierung abgeschlossen. Erfolgreiche Tests: {result.statistics['successful_expectations']} von {result.statistics['evaluated_expectations']}")
    return result

def speichere_validierungsergebnis(ergebnis: ge.core.ExpectationValidationResult, datei_pfad: str) -> None:
    """
    Speichert ein Validierungsergebnis in einer JSON-Datei.
    
    Args:
        ergebnis: ExpectationValidationResult-Objekt
        datei_pfad: Pfad zur JSON-Datei
    """
    with open(datei_pfad, 'w') as f:
        json.dump(ergebnis.to_json_dict(), f, indent=2)
    logger.info(f"Validierungsergebnis gespeichert unter: {datei_pfad}")

def erstelle_kontinuierlichen_test_workflow() -> str:
    """
    Erstellt ein Python-Skript für kontinuierliche Datentests.
    
    Returns:
        String mit dem Python-Code für das Skript
    """
    script = '''#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Kontinuierlicher Datenqualitätstest
-----------------------------------

Dieses Skript führt regelmäßige Überprüfungen der Datenqualität durch.
Es kann als Cron-Job oder in CI/CD-Pipelines verwendet werden.

Verwendung:
    python datentests.py [Tabelle] [Erwartungssuite] [Ausgabedatei]
"""

import os
import sys
import json
import pandas as pd
from datetime import datetime
from data_quality import (
    get_db_connection, table_to_dataframe, 
    lade_expectations_suite, teste_daten_gegen_erwartungen,
    speichere_validierungsergebnis
)

def main():
    # Parameter auswerten
    if len(sys.argv) < 4:
        print("Verwendung: python datentests.py [Tabelle] [Erwartungssuite] [Ausgabedatei]")
        sys.exit(1)
        
    table_name = sys.argv[1]
    expectations_file = sys.argv[2]
    output_file = sys.argv[3]
    
    # Datenbankverbindung herstellen
    engine = get_db_connection()
    
    # Daten laden
    df = table_to_dataframe(engine, table_name)
    
    # Erwartungen laden
    suite = lade_expectations_suite(expectations_file)
    
    # Daten validieren
    result = teste_daten_gegen_erwartungen(df, suite)
    
    # Ergebnis speichern
    speichere_validierungsergebnis(result, output_file)
    
    # Ausgabe
    success_rate = result.statistics['successful_expectations'] / result.statistics['evaluated_expectations']
    print(f"Erfolgsrate: {success_rate:.2%}")
    
    # Exit-Code basierend auf Erfolgsrate
    if success_rate < 0.9:  # Erfolgsrate unter 90%
        sys.exit(1)
    
    sys.exit(0)

if __name__ == "__main__":
    main()
'''
    return script

# ---- Ausreißererkennung ----

def identifiziere_ausreisser(df: pd.DataFrame, spalte: str, methode: str = 'iqr', 
                           faktor: float = 1.5) -> Tuple[pd.Series, Dict[str, float], Any]:
    """
    Identifiziert Ausreißer in einer Spalte eines DataFrames.
    
    Args:
        df: DataFrame mit den Daten
        spalte: Name der zu analysierenden Spalte
        methode: Methode zur Ausreißererkennung ('iqr' oder 'zscore')
        faktor: Faktor für die IQR-Methode (Standard: 1.5)
        
    Returns:
        Tuple mit (Ausreißer-Serie, Grenzen, Visualisierung)
    """
    if not pd.api.types.is_numeric_dtype(df[spalte].dtype):
        raise ValueError(f"Spalte {spalte} muss numerisch sein.")
    
    # Fehlende Werte entfernen
    data = df[spalte].dropna()
    
    if methode.lower() == 'iqr':
        # IQR-Methode
        Q1 = data.quantile(0.25)
        Q3 = data.quantile(0.75)
        IQR = Q3 - Q1
        
        lower_bound = Q1 - faktor * IQR
        upper_bound = Q3 + faktor * IQR
        
        ausreisser = df[(df[spalte] < lower_bound) | (df[spalte] > upper_bound)][spalte]
        grenzen = {'lower': lower_bound, 'upper': upper_bound, 'Q1': Q1, 'Q3': Q3, 'IQR': IQR}
        
        # Boxplot erstellen
        fig, ax = plt.subplots(figsize=(10, 6))
        ax.boxplot(data)
        ax.set_title(f'Boxplot für {spalte} mit IQR-Methode (Faktor: {faktor})')
        ax.set_ylabel(spalte)
        
    elif methode.lower() == 'zscore':
        # Z-Score-Methode
        mean = data.mean()
        std = data.std()
        
        z_scores = abs((data - mean) / std)
        ausreisser = df[z_scores > faktor][spalte]
        grenzen = {'mean': mean, 'std': std, 'threshold': faktor}
        
        # Histogramm mit Z-Scores erstellen
        fig, ax = plt.subplots(figsize=(10, 6))
        ax.hist(z_scores, bins=30)
        ax.axvline(x=faktor, color='r', linestyle='--')
        ax.set_title(f'Z-Scores für {spalte} (Schwellenwert: {faktor})')
        ax.set_xlabel('Z-Score')
        ax.set_ylabel('Häufigkeit')
        
    else:
        raise ValueError(f"Unbekannte Methode: {methode}. Unterstützte Methoden: 'iqr', 'zscore'")
    
    return ausreisser, grenzen, fig

# ---- Hauptfunktion ----

def main():
    """
    Hauptfunktion für den direkten Aufruf des Skripts.
    """
    import argparse
    
    parser = argparse.ArgumentParser(description='Datenqualitätswerkzeug für Bau-Structura')
    
    # Hauptbefehle
    subparsers = parser.add_subparsers(dest='command', help='Befehl')
    
    # Profil-Befehl
    profile_parser = subparsers.add_parser('profile', help='Datenprofile erstellen')
    profile_parser.add_argument('--tables', nargs='+', help='Zu profilierende Tabellen')
    profile_parser.add_argument('--limit', type=int, help='Maximale Anzahl der zu ladenden Zeilen')
    profile_parser.add_argument('--output-dir', help='Ausgabeverzeichnis für Berichte')
    
    # Erwartungen-Befehl
    expect_parser = subparsers.add_parser('expect', help='Erwartungssuite erstellen')
    expect_parser.add_argument('table', help='Tabelle für die Erwartungssuite')
    expect_parser.add_argument('--output', required=True, help='Ausgabedatei für die Erwartungssuite')
    
    # Test-Befehl
    test_parser = subparsers.add_parser('test', help='Daten gegen Erwartungen testen')
    test_parser.add_argument('table', help='Zu testende Tabelle')
    test_parser.add_argument('--expectations', required=True, help='Erwartungssuite-Datei')
    test_parser.add_argument('--output', required=True, help='Ausgabedatei für das Testergebnis')
    
    # Ausreißer-Befehl
    outlier_parser = subparsers.add_parser('outliers', help='Ausreißer identifizieren')
    outlier_parser.add_argument('table', help='Tabelle für die Ausreißeranalyse')
    outlier_parser.add_argument('column', help='Zu analysierende Spalte')
    outlier_parser.add_argument('--method', choices=['iqr', 'zscore'], default='iqr', help='Methode zur Ausreißererkennung')
    outlier_parser.add_argument('--factor', type=float, default=1.5, help='Faktor für die Ausreißererkennung')
    
    args = parser.parse_args()
    
    # Datenbankverbindung herstellen
    engine = get_db_connection()
    
    if args.command == 'profile':
        tabellen_profilieren(
            engine,
            table_names=args.tables,
            limit=args.limit,
            output_dir=args.output_dir
        )
    
    elif args.command == 'expect':
        df = table_to_dataframe(engine, args.table)
        suite = erstelle_expectations_suite(df, suite_name=f"{args.table}_suite")
        speichere_expectations_suite(suite, args.output)
        print(f"Erwartungssuite für {args.table} erstellt und unter {args.output} gespeichert.")
    
    elif args.command == 'test':
        df = table_to_dataframe(engine, args.table)
        suite = lade_expectations_suite(args.expectations)
        result = teste_daten_gegen_erwartungen(df, suite)
        speichere_validierungsergebnis(result, args.output)
        
        success_rate = result.statistics['successful_expectations'] / result.statistics['evaluated_expectations']
        print(f"Erfolgsrate: {success_rate:.2%}")
    
    elif args.command == 'outliers':
        df = table_to_dataframe(engine, args.table)
        ausreisser, grenzen, fig = identifiziere_ausreisser(
            df, args.column, methode=args.method, faktor=args.factor
        )
        
        print(f"Gefundene Ausreißer: {len(ausreisser)}")
        print(f"Grenzen: {grenzen}")
        
        # Speichere Grafik
        fig_path = f"ausreisser_{args.table}_{args.column}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
        fig.savefig(fig_path)
        print(f"Grafik gespeichert unter: {fig_path}")
        
        if not ausreisser.empty:
            print("\nBeispiel-Ausreißer:")
            print(ausreisser.head(10))

if __name__ == "__main__":
    main()