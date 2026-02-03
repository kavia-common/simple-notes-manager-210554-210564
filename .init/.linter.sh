#!/bin/bash
cd /home/kavia/workspace/code-generation/simple-notes-manager-210554-210564/notes_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

