#!/bin/bash

# Server im Hintergrund starten
npm run dev &

# Warte 2 Sekunden, damit der Server Zeit hat zu starten
sleep 2

# Ausgabe, dass der Server gestartet wurde
echo "Server gestartet im Hintergrund"

# Keep the script running to prevent the workflow from ending
tail -f /dev/null