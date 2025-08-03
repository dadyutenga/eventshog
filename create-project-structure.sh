#!/bin/bash

# Create main directory structure
mkdir -p src/{common,core,modules,config,infra,tests}

# Create common subdirectories
mkdir -p src/common/{decorators,dto,filters,guards,interceptors,pipes,utils}
touch src/common/{constants.ts,types.ts}

# Create core subdirectories
mkdir -p src/core/{database,logger,config}
touch src/core/core.module.ts

# Create module structure (for each module)
declare -a modules=("analytics" "kafka-producer" "kafka-consumer" "clickhouse" "dashboard")

for module in "${modules[@]}"; do
    mkdir -p "src/modules/$module"/{controllers,services,dto,entities,events,repositories,interfaces}
    touch "src/modules/$module/$module.module.ts"
done

# Create infra subdirectories
mkdir -p src/infra/{cache,messaging,storage,external-api}

# Create tests subdirectories
mkdir -p src/tests/{e2e,unit}

# Create config files
touch src/config/{config.module.ts,env.validation.ts,app.config.ts}

# Create main application files
touch src/{main.ts,app.module.ts,app.controller.ts,app.service.ts,server.ts}

echo "Project structure created successfully!" 