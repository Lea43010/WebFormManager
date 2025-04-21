#!/bin/bash
curl -s -X GET -H "Cookie: $(cat cookies.txt)" http://localhost:3000/api/subscription/status