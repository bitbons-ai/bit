#!/bin/bash

verify_project() {
  local project_name=$1
  echo "Verifying project structure..."
  
  # Check files exist
  files=(
    "docker-compose.yml"
    "apps/web/package.json"
    "apps/web/Dockerfile"
    "apps/pb/Dockerfile"
  )
  
  for file in "${files[@]}"; do
    if [ -f "$project_name/$file" ]; then
      echo "✓ $file exists"
    else
      echo "✗ $file missing"
      exit 1
    fi
  done
  
  # Validate docker-compose
  cd "$project_name" && docker compose config --quiet
  if [ $? -eq 0 ]; then
    echo "✓ Docker Compose configuration is valid"
  else
    echo "✗ Docker Compose configuration is invalid"
    exit 1
  fi
}

# Make script executable
chmod +x verify.sh

# Run verification
npm link && \
bit new test-project --pb 0.25.1 --astro 5.1.8 && \
verify_project test-project
