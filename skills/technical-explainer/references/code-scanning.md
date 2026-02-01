# Code Scanning Patterns

Quick reference for extracting information from codebases.

## Go Codebases

### Types
```bash
# All struct definitions
grep -rn "^type .* struct" --include="*.go" $PATH

# All interfaces
grep -rn "^type .* interface" --include="*.go" $PATH

# Type with body
grep -rn "^type " --include="*.go" -A 20 $PATH | head -100
```

### Functions
```bash
# All exported functions
grep -rn "^func [A-Z]" --include="*.go" $PATH

# Methods on specific type
grep -rn "^func (.*TypeName)" --include="*.go" $PATH

# Function with body
grep -rn "^func EncodeValue" --include="*.go" -A 50 $PATH
```

### Constants & Variables
```bash
# All constants
grep -rn "^const\|^var " --include="*.go" $PATH | grep -v "_test.go"

# Iota enums
grep -rn "iota" --include="*.go" -B 5 -A 10 $PATH
```

### Imports (dependency analysis)
```bash
# What does this package import
grep -rn "^import" --include="*.go" $PATH -A 20 | grep '^\s*"'

# Who imports this package
grep -rn '"package/name"' --include="*.go" .
```

### Error Definitions
```bash
# Custom errors
grep -rn "var Err\|errors.New\|fmt.Errorf" --include="*.go" $PATH
```

## Rust Codebases

### Types
```bash
# Structs
grep -rn "^pub struct\|^struct" --include="*.rs" $PATH

# Enums
grep -rn "^pub enum\|^enum" --include="*.rs" $PATH

# Traits
grep -rn "^pub trait\|^trait" --include="*.rs" $PATH

# Type aliases
grep -rn "^pub type\|^type .* =" --include="*.rs" $PATH
```

### Functions
```bash
# Public functions
grep -rn "^pub fn" --include="*.rs" $PATH

# Impl blocks
grep -rn "^impl" --include="*.rs" -A 30 $PATH
```

### Macros
```bash
grep -rn "macro_rules!" --include="*.rs" $PATH
grep -rn "#\[derive" --include="*.rs" $PATH
```

## TypeScript Codebases

### Types
```bash
# Interfaces
grep -rn "^export interface\|^interface " --include="*.ts" $PATH

# Type aliases
grep -rn "^export type\|^type " --include="*.ts" $PATH

# Classes
grep -rn "^export class\|^class " --include="*.ts" $PATH
```

### Functions
```bash
# Exported functions
grep -rn "^export function\|^export const .* = " --include="*.ts" $PATH
```

## Python Codebases

### Classes
```bash
# All classes
grep -rn "^class " --include="*.py" $PATH

# Dataclasses
grep -rn "@dataclass" --include="*.py" -A 10 $PATH
```

### Functions
```bash
# All functions
grep -rn "^def \|^async def " --include="*.py" $PATH

# Methods
grep -rn "    def " --include="*.py" $PATH
```

## Cross-Language Patterns

### Find test files
```bash
find $PATH -name "*_test.*" -o -name "test_*" -o -name "*.spec.*"
```

### Find main entry points
```bash
find $PATH -name "main.*" -o -name "index.*" -o -name "mod.rs" -o -name "__main__.py"
```

### Find configuration
```bash
find $PATH -name "*.yaml" -o -name "*.yml" -o -name "*.toml" -o -name "*.json" | grep -v node_modules
```

### Count lines by file type
```bash
find $PATH -name "*.go" | xargs wc -l | tail -1
find $PATH -name "*.rs" | xargs wc -l | tail -1
```

### Find TODO/FIXME/HACK comments
```bash
grep -rn "TODO\|FIXME\|HACK\|XXX\|BUG" --include="*.go" --include="*.rs" --include="*.ts" $PATH
```

### Find magic numbers
```bash
grep -rn "[^a-zA-Z][0-9]\{3,\}[^a-zA-Z0-9]" --include="*.go" $PATH
```

### Find unsafe code
```bash
# Go
grep -rn "unsafe\." --include="*.go" $PATH

# Rust
grep -rn "unsafe {" --include="*.rs" $PATH
```

## Codec-Specific Patterns

### Find encoding functions
```bash
grep -rn "func.*[Ee]ncode\|fn.*encode" --include="*.go" --include="*.rs" $PATH
```

### Find type tags / discriminants
```bash
grep -rn "tag\|Tag\|0x[0-9a-fA-F]\{2\}" --include="*.go" --include="*.rs" $PATH
```

### Find varint implementations
```bash
grep -rn "varint\|Varint\|VarInt" --include="*.go" --include="*.rs" $PATH
```

### Find buffer/writer patterns
```bash
grep -rn "Write\|Buffer\|buf\." --include="*.go" $PATH
```

## Output Formatting

### Get function with full body
```bash
# Go: Get everything from func to next func or end of file
awk '/^func TargetFunction/,/^func [A-Z]/' file.go
```

### Extract type definition
```bash
# Go: Get struct with all fields
awk '/^type TargetType struct/,/^}/' file.go
```

### Count occurrences
```bash
grep -roh "pattern" --include="*.go" $PATH | wc -l
```
