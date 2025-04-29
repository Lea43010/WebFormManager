#!/bin/bash

# Führe die SQL-Migration aus
psql $DATABASE_URL -f migration_road_damages.sql

# Beende das Skript mit Erfolg
exit 0