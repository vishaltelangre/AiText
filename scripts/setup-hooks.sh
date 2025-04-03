#!/bin/sh

if [ ! -f .git/hooks/pre-commit ]; then
  echo "Setting up pre-commit hook..."
  mkdir -p .git/hooks
  echo "#!/bin/sh\npnpm format && pnpm lint" > .git/hooks/pre-commit
  chmod +x .git/hooks/pre-commit
  echo "Pre-commit hook setup complete"
else
  echo "Pre-commit hook already exists, skipping..."
fi
