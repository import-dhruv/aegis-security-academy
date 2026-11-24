===MODULE===
TITLE: Bits, Bytes, and Binary
LEVEL: Beginner
MINUTES: 30
SUMMARY: Build the mental model that all binary data is bits grouped into addressable bytes, and learn to read raw dumps safely.
OBJECTIVES: distinguish bit, byte, word, dword, qword | interpret a raw hex dump | avoid width and signedness mistakes
TAKEAWAYS: memory is numbered bytes | width and signedness define meaning | explicit formats prevent errors
PRACTICE: In an isolated lab, create your own binary buffer file and inspect it with `xxd -g1`, documenting each field's width.
SOURCES: None
---
## Core idea
Everything a reverse engineer inspects is ultimately bits. A **bit** holds one of two states, 0 or 1. Eight bits form a **byte**, the smallest addressable unit on x86-64. A **word** is 2 bytes, a **dword** is 4, and a **qword** is 8. Grouping bits in fours gives **nibbles**, which map one-to-one onto hexadecimal digits. The mental model: memory is a long row of numbered bytes, and a value spanning several bytes is a consecutive run interpreted with a chosen width and signedness. Confusing width or signedness causes most beginner reversing errors.

### Method
1. Identify the declared width of the value (`char`, `int`, `long`, pointer).
2. Convert raw bits to hex by grouping into nibbles.
3. Decide signed versus unsigned before interpreting.
4. Check alignment and byte order for multi-byte values.

### Example
In an authorized sandbox, a helper prints a buffer:
```bash
$ xxd -g1 <LAB>/buf.bin
00000000: 41 42 7f ff 10 00 00 00  A B.......
```
`41 42 7f` are ASCII `A`, `B`, DEL. `ff` is 255 unsigned but -1 signed. `10 00 00 00` is a 32-bit value 0x10.

| Group | Bits | Hex range | Note |
| --- | --- | --- | --- |
| nibble | 4 | 0-F | one hex digit |
| byte | 8 | 00-FF | addressable unit |
| word | 16 | 0000-FFFF | 2 bytes |
| dword | 32 | 00000000-FFFFFFFF | 4 bytes |
| qword | 64 | 8 bytes | register width |

### Common mistakes
Reading `ff` as a character instead of a number; assuming pointers are 4 bytes in a 64-bit binary; forgetting C `char` signedness is implementation-defined.

### Defense / verification
Print with explicit widths (`%#x`, `%lld`) in your own harness and assert sizes with `sizeof`. Width mismatches in length fields are a frequent parser-crash source, so validate them when testing your own code.

### Knowledge check
**Q:** What is `0xFF` as an 8-bit signed value? **A:** -1 (two's complement).

===MODULE===
TITLE: Hexadecimal and Base Conversions
LEVEL: Beginner
MINUTES: 25
SUMMARY: Treat hexadecimal as compact binary notation and convert fluently between bases using simple tools.
OBJECTIVES: explain hex as 4-bit groups | convert between decimal, hex, and binary | recognize common prefixes
TAKEAWAYS: one hex digit equals four bits | addresses and opcodes are usually hex | always round-trip conversions
PRACTICE: In your own lab file, convert ten offsets between decimal and hex with `python3` and verify each by converting back.
SOURCES: None
---
## Core idea
Hexadecimal is base 16, using digits 0-9 and A-F. It is popular in reversing because one hex digit represents exactly four bits, so a byte is always two digits and a 64-bit address is sixteen. When a disassembler shows `0x401000`, that is a numeric address, not text. The mental model: hex is a *shorthand for the bit pattern*, so converting is mechanical regrouping, never interpretation. Confusion arises when a hex byte like `41` is also the ASCII code for `A`; context (a string field versus an integer field) decides which meaning applies.

### Method
1. Note the base prefix: `0x` hex, `0b` binary, `0o` octal, bare digits decimal.
2. Group binary by fours from the right, map each group to a hex digit.
3. Use a tool for arithmetic rather than mental math.
4. Round-trip to confirm the result.

### Example
In an isolated sandbox:
```bash
$ python3 -c 'print(hex(0b01000001), int("41",16), bin(65))'
0x41 65 0b1000001
$ printf '%x\n' 4096
1000
```
Here `41` is simultaneously hex 0x41, decimal 65, and binary 01000001 — three notations for the same bits.

| Prefix | Base | Example | Value |
| --- | --- | --- | --- |
| `0x` | 16 | `0x2A` | 42 |
| `0b` | 2 | `0b101010` | 42 |
| `0o` | 8 | `0o52` | 42 |
| none | 10 | `42` | 42 |

### Common mistakes
Dropping leading zeros and misaligning nibble groups; reading `0x10` as sixteen but treating `10` as ten; assuming a hex dump column is decimal.

### Defense / verification
Keep a small conversion helper script in your lab and cross-check every offset you annotate. In your own code, use typed literals so the base is unambiguous.

### Knowledge check
**Q:** Convert `0x2A` to decimal. **A:** 42.

===MODULE===
TITLE: Two's Complement and Signed Arithmetic
LEVEL: Beginner
MINUTES: 30
SUMMARY: Understand how signed integers are encoded and why sign extension and comparison bugs matter when reading disassembly.
OBJECTIVES: compute two's complement negatives | explain sign extension | spot signed-versus-unsigned comparisons
TAKEAWAYS: negative equals invert plus one | sign extension propagates the top bit | comparisons depend on signedness
PRACTICE: In an isolated lab, compile a tiny program with both signed and unsigned comparisons and inspect the branch instructions it produces.
SOURCES: None
---
## Core idea
x86-64 uses two's complement for signed integers. To negate a value, invert every bit and add one. The high bit is the sign bit: for an 8-bit byte, `0x80` through `0xFF` represent -128 through -1. The range is asymmetric: a byte holds -128 to 127. **Sign extension** copies the top bit when widening a value so its numeric meaning is preserved; **zero extension** fills with zeros. The mental model: the bit pattern is unchanged by widening, but the *sign meaning* depends on which extension instruction the compiler chose (`movsx` versus `movzx`). This is a rich source of real bugs and of subtle decompiler output.

### Method
1. Read the width from the register name (`al`, `ax`, `eax`, `rax`).
2. Check whether the program sign-extends or zero-extends.
3. Look at comparison opcodes: `jl`/`jge` are signed, `jb`/`jae` are unsigned.
4. Trace negative constants such as `0xffffffff` as -1.

### Example
In a debugger on your own binary:
```bash
(gdb) p/x (char)0x80
$1 = 0x80
(gdb) p/d (char)0x80
$2 = -128
(gdb) x/i $pc
=> 0x401015: movsx eax,BYTE PTR [rbp-0x1]
```
`movsx` means the byte is treated as signed; a `movzx` would have made it 128.

| Width | Signed range | Unsigned max |
| --- | --- | --- |
| byte | -128..127 | 255 |
| word | -32768..32767 | 65535 |
| dword | -2^31..2^31-1 | 2^32-1 |
| qword | -2^63..2^63-1 | 2^64-1 |

### Common mistakes
Reading `cmp` without checking the following branch type; assuming negative numbers appear as a minus sign in hex dumps; missing that `sub` sets the same flags as addition of a negative.

### Defense / verification
Use explicit integer types and bounds checks in your own code; enable compiler warnings for signed/unsigned conversions. In review, verify each index comparison uses the right signedness.

### Knowledge check
**Q:** What signed 8-bit value is `0x80`? **A:** -128.

===MODULE===
TITLE: Endianness
LEVEL: Beginner
MINUTES: 30
SUMMARY: Master byte order so multi-byte values in dumps, packets, and registers are interpreted correctly.
OBJECTIVES: define little and big endian | decode a multi-byte value from a dump | recognize network byte order
TAKEAWAYS: x86-64 is little-endian | the lowest address holds the least significant byte | protocols often use big-endian
PRACTICE: In an isolated lab, write the same 32-bit constant in host and network order and inspect both files with `xxd`.
SOURCES: None
---
## Core idea
Endianness is the order in which the bytes of a multi-byte value are stored. **Little-endian** puts the least significant byte at the lowest address; **big-endian** puts the most significant byte first. x86-64 is little-endian, so the 32-bit value 0xDEADBEEF appears in memory as `ef be ad de`. Network protocols conventionally use big-endian ("network byte order"). The mental model: addresses increase left to right in a hex dump, but numeric significance runs right to left on little-endian machines. Always decide the width first, then reverse the byte sequence for human reading.

### Method
1. Find the field's starting address and width.
2. List the bytes in increasing address order.
3. On little-endian, reverse them to form the numeric hex value.
4. For network data, keep the order as-is (big-endian).

### Example
In an authorized sandbox:
```bash
$ xxd -g1 <LAB>/word.bin
00000000: 78 56 34 12 00 00 00 00  xV4......
$ python3 -c 'import struct;print(hex(struct.unpack("<I",bytes.fromhex("78563412"))[0]))'
0x12345678
```
The bytes `78 56 34 12` are little-endian for 0x12345678; as big-endian they would be 0x78563412.

| Context | Typical order | Example bytes | Value |
| --- | --- | --- | --- |
| x86 memory | little | `ef be ad de` | 0xDEADBEEF |
| IPv4 header | big | `c0 a8 01 01` | 192.168.1.1 |
| ELF fields | little (on x86) | - | - |

### Common mistakes
Reading a dump as if bytes were in numeric order; forgetting that `htons`/`ntohl` convert between orders; mixing instruction immediates (already numeric) with stored data.

### Defense / verification
Use `struct.pack`/`unpack` with explicit `<` or `>` in your own tools, and add unit tests with non-palindromic constants like 0x01020304 so byte order is visible.

### Knowledge check
**Q:** Little-endian bytes `78 56 34 12` form what 32-bit value? **A:** 0x12345678.

===MODULE===
TITLE: x86-64 General-Purpose Registers
LEVEL: Beginner
MINUTES: 35
SUMMARY: Learn the register file, sub-register naming, and the special roles of RSP, RIP, and RFLAGS.
OBJECTIVES: name the 16 GPRs and their sub-registers | identify special-purpose registers | know caller- versus callee-saved roles
TAKEAWAYS: RAX-R15 are 64-bit GPRs | writes to 32-bit sub-registers zero the upper half | RSP and RIP drive control flow
PRACTICE: In an isolated lab, step through your own tiny program in GDB and record how RAX, RDI, RSP, and RIP change.
SOURCES: None
---
## Core idea
x86-64 provides sixteen 64-bit general-purpose registers: RAX, RBX, RCX, RDX, RSI, RDI, RBP, RSP, and R8-R15. Each has 32-bit (`eax`), 16-bit (`ax`), and 8-bit (`al`) forms; some allow `ah` for the high byte. A crucial quirk: writing to a 32-bit sub-register **zeroes** the upper 32 bits of the parent. RIP holds the next instruction address; RSP points to the stack top; RFLAGS holds condition codes. The mental model: registers are named scratch slots with conventional roles — RAX for returns, RDI/RSI/RDX/RCX/R8/R9 for arguments under System V, RSP for the stack — and the calling convention assigns meaning to otherwise interchangeable storage.

### Method
1. Read the register width from the mnemonic suffix in disassembly.
2. Track which registers survive a call (callee-saved: RBX, RBP, R12-R15).
3. Watch RSP for stack adjustment; watch RIP for control flow.
4. Note that instruction pointers shown are typically the *next* instruction.

### Example
In GDB on your own binary:
```bash
(gdb) info registers rax rdi rsp rip
rax  0x1                 1
rdi  0x7fffffffe010      140737488347152
rsp  0x7fffffffdf00      140737488346880
rip  0x401136            0x401136
(gdb) x/3i $rip
=> 0x401136: push rbp
   0x401137: mov rbp,rsp
   0x40113a: sub rsp,0x10
```

| Register | Conventional role | Saved by |
| --- | --- | --- |
| RAX | return value | caller |
| RDI, RSI, RDX | args 1-3 (SysV) | caller |
| RBX, R12-R15 | callee-saved | callee |
| RSP | stack pointer | special |
| RIP | instruction pointer | special |

### Common mistakes
Assuming `mov eax, 1` preserves the upper bits of RAX; assuming all registers are preserved across calls; forgetting `ah` is unavailable with a REX prefix.

### Defense / verification
Use `info registers` frequently while stepping your own code, and compile with frame pointers (`-fno-omit-frame-pointer`) to simplify tracing.

### Knowledge check
**Q:** Which register holds the first System V AMD64 integer argument? **A:** RDI.

===MODULE===
TITLE: Data Movement and Arithmetic Instructions
LEVEL: Beginner
MINUTES: 35
SUMMARY: Read common x86-64 instructions and understand the difference between `mov` and `lea` plus flag-setting operations.
OBJECTIVES: interpret mov, lea, add, sub, xor, cmp, test | distinguish memory access from address math | predict flag changes
TAKEAWAYS: lea computes an address without loading memory | xor reg,reg is a zeroing idiom | cmp and test set flags for branches
PRACTICE: In an isolated lab, disassemble your own C functions with `objdump -d` and annotate ten `mov` versus `lea` instructions.
SOURCES: None
---
## Core idea
The most frequent x86-64 instructions are surprisingly few. `mov` copies data between registers, memory, and immediates. `lea` ("load effective address") computes an address expression such as `[rbp-0x10]` and stores the *address*, not the contents — compilers also abuse it for cheap arithmetic. `add`, `sub`, `inc`, `dec`, `xor`, `and`, `or`, and `shl` perform arithmetic and update flags. `cmp` subtracts without storing the result; `test` ANDs without storing. The mental model: each instruction either moves a value, computes one, or sets up a decision via flags; recognizing these three categories lets you follow most functions.

### Method
1. Identify the operand forms: immediate `$`, register `%`, memory `()` in AT&T syntax.
2. For `lea`, compute the address expression numerically.
3. For `mov`, track where bytes actually come from.
4. Find the branch following `cmp`/`test` to recover the condition.

### Example
From your own lab binary:
```bash
$ objdump -d -M intel <LAB>/demo | sed -n '/<f>:/,/ret/p'
401126: lea eax,[rdi+1]      ; eax = rdi + 1
401129: mov eax,DWORD PTR [rbp-0x4] ; load from stack
40112c: xor eax,eax          ; eax = 0, sets ZF
40112e: cmp eax,0x0
401131: je 401139
```

| Instruction | Effect | Flags |
| --- | --- | --- |
| `mov` | copy | unchanged |
| `lea` | compute address | unchanged |
| `add`/`sub` | arithmetic | set |
| `xor reg,reg` | zero | ZF=1 |
| `cmp`/`test` | compare only | set |

### Common mistakes
Treating `lea` as a memory read; missing that `xor eax,eax` affects flags; confusing AT&T and Intel operand order.

### Defense / verification
Reassemble small snippets you write yourself and compare source to disassembly until operand order is automatic. Enable Intel syntax in your disassembler to reduce ambiguity.

### Knowledge check
**Q:** What does `xor eax,eax` accomplish? **A:** Sets EAX to zero and sets ZF.

===MODULE===
TITLE: Stack Frames and the Call Stack
LEVEL: Beginner
MINUTES: 40
SUMMARY: Understand how functions build stack frames, store locals, and unwind on return.
OBJECTIVES: describe stack growth direction | recognize prologue and epilogue | locate locals relative to RBP
TAKEAWAYS: the stack grows toward lower addresses | `push rbp; mov rbp,rsp; sub rsp,N` builds a frame | `leave; ret` tears it down
PRACTICE: In an isolated lab, compile with and without frame pointers and compare the disassembly of the same function.
SOURCES: None
---
## Core idea
The call stack stores return addresses, saved registers, and local variables. It grows **downward**: a `push` decreases RSP. A typical prologue is `push rbp`, `mov rbp,rsp`, `sub rsp,N`, which pins a stable frame pointer in RBP and reserves N bytes for locals. Locals are then referenced as `[rbp-0x8]`, passed arguments as `[rbp+0x10]` in 32-bit code (in 64-bit code most arguments arrive in registers). The epilogue `leave` performs `mov rsp,rbp; pop rbp`, restoring the caller's frame, and `ret` pops the return address into RIP. The mental model: each active call is a stacked record; RBP is the bookmark, RSP the moving cursor.

### Method
1. Find the prologue to determine frame size.
2. Map each `[rbp-offset]` to a local slot.
3. Track `call` sites (which push a return address).
4. Follow `leave`/`ret` to see cleanup.

### Example
Disassembly of your own function:
```bash
$ objdump -d -M intel <LAB>/frames | sed -n '/<vuln>:/,/ret/p'
401140: push rbp
401141: mov rbp,rsp
401144: sub rsp,0x20
401148: mov DWORD PTR [rbp-0x4],0x0
401152: lea rax,[rbp-0x20]
401156: mov rdi,rax
401159: call 401030 <gets@plt>
40115e: leave
40115f: ret
```
The 0x20-byte region `[rbp-0x20]` is a local buffer.

| Element | Location | Purpose |
| --- | --- | --- |
| Local buffer | `rbp-0x20` | caller-unique storage |
| Saved RBP | `[rbp]` | previous frame link |
| Return address | `[rbp+8]` | resume point |

### Common mistakes
Assuming arguments are always on the stack in 64-bit code; forgetting the 16-byte stack alignment before calls; misreading red-zone usage below RSP.

### Defense / verification
Use GDB's `bt` and `info frame` while stepping your own program. Compile with `-fstack-protector-strong` to see canary checks inserted into frames.

### Knowledge check
**Q:** What does `leave` do? **A:** `mov rbp,rsp` followed by `pop rbp`.

===MODULE===
TITLE: Calling Conventions (System V AMD64)
LEVEL: Beginner
MINUTES: 40
SUMMARY: Learn the 64-bit Unix calling convention so you can reconstruct function signatures from register usage.
OBJECTIVES: list integer argument registers | identify return and caller-saved registers | respect stack alignment
TAKEAWAYS: args 1-6 use RDI, RSI, RDX, RCX, R8, R9 | RAX holds the return value | RBX and R12-R15 are callee-saved
PRACTICE: In an isolated lab, write functions with 3, 6, and 7 arguments, disassemble them, and document where each argument arrives.
SOURCES: None
---
## Core idea
A calling convention is the contract between caller and callee about where arguments go, who preserves which registers, and how the stack is aligned. System V AMD64 (Linux/macOS) passes the first six integer/pointer arguments in RDI, RSI, RDX, RCX, R8, R9; further arguments go on the stack. RAX carries integer returns (RDX for 128-bit returns). Caller-saved registers may be clobbered by a call; callee-saved registers (RBX, RBP, R12-R15) must be restored. The stack must be 16-byte aligned at the call site, and variadic functions set AL to the number of vector registers used. The mental model: registers are a parameter-passing bus; the convention tells you which wire carries which value.

### Method
1. At a `call`, inspect RDI, RSI, RDX, RCX, R8, R9.
2. Count arguments; anything beyond six is at `[rsp+8]`, `[rsp+16]`, and so on after the call pushes the return address.
3. Check the callee's prologue to see which registers it saves.
4. Read RAX after the call for the result.

### Example
```bash
$ objdump -d -M intel <LAB>/conv | sed -n '/<caller>:/,/ret/p'
401150: mov edi,0x1
401155: mov esi,0x2
40115a: mov edx,0x3
40115f: mov eax,0x0
401161: call 401126 <add3>
401166: mov DWORD PTR [rbp-0x4],eax
```
`add3(1, 2, 3)` — result taken from EAX.

| Item | SysV AMD64 | Windows x64 |
| --- | --- | --- |
| Arg 1 | RDI | RCX |
| Arg 2 | RSI | RDX |
| Arg 4 | RCX | R9 |
| Shadow space | none | 32 bytes |

### Common mistakes
Forgetting that 32-bit writes zero upper halves; ignoring stack alignment; assuming Windows and SysV conventions match.

### Defense / verification
Declare prototypes explicitly in your own code and inspect disassembly to confirm argument order. When reversing, annotate calls with inferred signatures and revise as more call sites appear.

### Knowledge check
**Q:** Where is the seventh integer argument under System V AMD64? **A:** On the stack at `[rsp+8]` at the call site.

===MODULE===
TITLE: Process Memory Layout
LEVEL: Beginner
MINUTES: 30
SUMMARY: Map a running process into text, data, heap, stack, and library regions using /proc and debugger maps.
OBJECTIVES: name the main memory regions | interpret /proc/pid/maps | explain heap versus stack growth
TAKEAWAYS: code and constants are read-only | heap grows up, stack grows down | shared libraries occupy mapped regions
PRACTICE: In an isolated lab, run your own program and capture `pmap` and `/proc/<pid>/maps`, labeling each region.
SOURCES: None
---
## Core idea
A Linux process is a set of memory mappings. The **text** segment holds executable instructions and is read-only. **rodata** holds constants and string literals. **data** and **bss** hold initialized and zero-initialized globals. The **heap** grows upward from the data area for dynamic allocations. The **stack** grows downward and holds frames and locals. Shared libraries and the loader are mapped into the same address space. The mental model: addresses form a sparse landscape of regions with different permissions (`r-x` code, `rw-` data); a reverse engineer reads these permissions to predict which corruptions are possible.

### Method
1. From a shell, read `/proc/<pid>/maps` for a paused own process.
2. In GDB, use `info proc mappings`.
3. Note the permission string and the backing file for each range.
4. Identify the stack (highest addresses), heap (near data), and libraries (middle).

### Example
In an authorized sandbox:
```bash
$ cat /proc/<LAB_PID>/maps | head
00400000-00401000 r-xp  /LAB/demo      # text
00600000-00601000 rw-p  /LAB/demo      # data/bss
7ffff7a00000-7ffff7bcd000 r-xp /lib/libc.so.6
7ffffffde000-7ffffffff000 rw-p [stack]
```

| Region | Permissions | Contents |
| --- | --- | --- |
| text | r-x | instructions |
| rodata | r-- | literals |
| data/bss | rw- | globals |
| heap | rw- | malloc arena |
| stack | rw- | locals, returns |

### Common mistakes
Assuming the heap and stack are adjacent; treating all `rw-` regions as writable by your program; forgetting ASLR changes these addresses each run.

### Defense / verification
Use `info proc mappings` and `x` to inspect addresses before dereferencing. Understanding permissions is the first step in judging exploitability of a bug in your own code.

### Knowledge check
**Q:** In which region do string literals usually reside? **A:** `.rodata`, a read-only mapping.

===MODULE===
TITLE: The ELF File Format
LEVEL: Beginner
MINUTES: 40
SUMMARY: Learn how ELF stores code, data, and metadata, and how sections differ from loadable segments.
OBJECTIVES: parse the ELF header | list key sections | distinguish segments from sections
TAKEAWAYS: ELF headers describe layout | sections serve linking, segments serve loading | .text/.data/.got/.plt matter most
PRACTICE: In an isolated lab, inspect your own compiled binary with `readelf -h`, `-l`, and `-S` and tabulate the results.
SOURCES: None
---
## Core idea
ELF is the executable and object format used on Linux. An ELF file begins with a header describing architecture, entry point, and the offsets of two tables: the **program header table** (segments, consumed by the loader) and the **section header table** (sections, consumed by linkers and tools). Key sections include `.text` (code), `.rodata`, `.data`, `.bss`, `.symtab`/`.dynsym` (symbols), `.plt` and `.got` (dynamic calls), and `.rel*`/`.rela*` (relocations). The mental model: a *segment* is what the OS maps into memory; a *section* is how tools organize the file; one segment can contain several sections with shared permissions.

### Method
1. Run `readelf -h` to see type, machine, and entry point.
2. Run `readelf -l` to see loadable segments and their flags.
3. Run `readelf -S` to enumerate sections.
4. Cross-check an address from disassembly against its section.

### Example
In an authorized sandbox:
```bash
$ readelf -h <LAB>/demo | grep -E 'Class|Type|Machine|Entry'
  Class: ELF64
  Type: DYN (Position-Independent Executable)
  Machine: Advanced Micro Devices X86-64
  Entry point: 0x1040
$ readelf -S <LAB>/demo | grep -E '\.text|\.got|\.plt'
  [15] .text   PROGBITS  0000000000001040
  [22] .plt    PROGBITS  0000000000001020
  [23] .got    PROGBITS  0000000000003fd8
```

| Section | Role |
| --- | --- |
| `.text` | executable code |
| `.rodata` | constants |
| `.bss` | zero-init globals (no file bytes) |
| `.got` | resolved addresses |
| `.plt` | call stubs |

### Common mistakes
Equating sections with segments; expecting `.bss` to occupy file space; assuming fixed load addresses in a PIE.

### Defense / verification
Use `readelf` and `objdump -h` together and confirm that virtual addresses fall inside a `LOAD` segment. This habit prevents mislabeled annotations.

### Knowledge check
**Q:** Which ELF table describes loadable memory segments? **A:** The program header table.

===MODULE===
TITLE: The PE File Format
LEVEL: Beginner
MINUTES: 40
SUMMARY: Understand Windows Portable Executable layout, sections, and the import table that drives DLL resolution.
OBJECTIVES: parse a PE header | name common sections | explain the import address table
TAKEAWAYS: PE begins with MZ and PE signatures | sections mark code, data, and resources | imports resolve through the IAT
PRACTICE: In an isolated lab, inspect a self-compiled Windows executable with `objdump -x` or `pedump` and record its sections and imports.
SOURCES: None
---
## Core idea
PE (Portable Executable) is the Windows executable format. It starts with an `MZ` DOS stub, followed by the `PE\0\0` signature and a COFF file header. The optional header contains the image base, entry point, section alignment, and data directories — including imports, exports, resources, relocations, and the TLS directory. Sections such as `.text`, `.rdata`, `.data`, `.rsrc`, and `.reloc` group content with permissions. The mental model: PE is a set of labeled chunks plus a directory index; the loader reads that index to map sections and fix up DLL references.

### Method
1. Confirm signatures `MZ` and `PE\0\0`.
2. Read Machine, NumberOfSections, and ImageBase.
3. Enumerate sections with VirtualAddress, VirtualSize, and characteristics.
4. Parse the import directory to list DLLs and functions.

### Example
In an authorized sandbox:
```bash
$ objdump -x <LAB>/demo.exe | grep -E 'architecture|ImageBase|Sections'
architecture: i386:x86-64
ImageBase: 0x140000000
Sections: 12
$ objdump -p <LAB>/demo.exe | sed -n '/The Import Tables/,+12p'
DLL Name: KERNEL32.dll
  ExitProcess
  GetStdHandle
DLL Name: msvcrt.dll
  printf
```

| Directory | Purpose |
| --- | --- |
| Import | DLL functions needed |
| Export | functions offered |
| Base reloc | addresses to fix |
| Resource | icons, strings, manifests |

### Common mistakes
Confusing VirtualAddress with raw file offset; assuming a fixed ImageBase in modern ASLR-enabled binaries; ignoring that packed samples hide imports.

### Defense / verification
Cross-check tool output with a hex editor in your own lab. For defense, note that unusual sections or a tiny import set are triage signals, not proof of malice.

### Knowledge check
**Q:** What table lists DLL functions a PE imports? **A:** The import directory / Import Address Table.

===MODULE===
TITLE: The Mach-O File Format
LEVEL: Beginner
MINUTES: 35
SUMMARY: Learn the macOS executable format and how load commands describe segments and linked libraries.
OBJECTIVES: identify Mach-O headers and load commands | name common segments | locate dylib imports
TAKEAWAYS: Mach-O uses load commands instead of section headers | __TEXT and __DATA are core segments | dyld resolves dylib symbols
PRACTICE: In an isolated lab, build a tiny macOS sample (or use a provided test binary) and inspect it with `otool -l` and `otool -L`.
SOURCES: None
---
## Core idea
Mach-O is the native macOS executable format. A header identifies the CPU type and filetype, followed by a series of **load commands** that describe segments, linked libraries, the entry point, and code signatures. Common segments are `__TEXT` (code and constants), `__DATA` (globals), and `__LINKEDIT` (symbol and linking metadata). Within segments, sections such as `__text`, `__cstring`, and `__got` hold specific content. `dyld`, the dynamic loader, uses load commands like `LC_LOAD_DYLIB` to locate dependencies. The mental model: Mach-O is self-describing — the load commands are a to-do list the loader executes before jumping to the entry point.

### Method
1. Read the Mach-O header (magic, cputype, filetype).
2. List load commands with `otool -l` or `llvm-objdump`.
3. Note each segment's vmaddr and fileoff.
4. Use `otool -L` for linked dylibs and `nm` for symbols.

### Example
In an authorized sandbox:
```bash
$ otool -h <LAB>/sample | head
Mach header
      magic cputype cpusubtype  filetype
    0xfeedfacf 16777223          3          2
$ otool -L <LAB>/sample
<LAB>/sample:
  /usr/lib/libSystem.B.dylib
```

| Load command | Role |
| --- | --- |
| LC_SEGMENT_64 | map a segment |
| LC_LOAD_DYLIB | dependency |
| LC_MAIN | entry point |
| LC_CODE_SIGNATURE | signature data |

### Common mistakes
Treating file offsets as virtual addresses; assuming Linux tools parse Mach-O symbol conventions identically; ignoring FAT/universal binaries containing multiple architectures.

### Defense / verification
Verify section addresses against their segment's vmaddr range. In authorized triage, unusual dylib paths or missing signatures are leads worth documenting, not conclusions.

### Knowledge check
**Q:** Which load command names a required dylib? **A:** `LC_LOAD_DYLIB`.

===MODULE===
TITLE: The Loader: Segments and Mapping
LEVEL: Intermediate
MINUTES: 40
SUMMARY: Follow how the OS maps a file into memory, applies protections, and prepares the process to run.
OBJECTIVES: describe mapping from program headers to memory | explain permissions and alignment | locate the entry point
TAKEAWAYS: the loader maps PT_LOAD segments | permissions come from segment flags | execution starts at the entry point
PRACTICE: In an isolated lab, trace your own binary with `strace` and `LD_DEBUG=files` to observe mapping and library loading.
SOURCES: None
---
## Core idea
Before `main` runs, the loader creates the process image. For ELF it reads each `PT_LOAD` program header and maps file bytes at the specified virtual address with the given flags (`R`, `W`, `X`). Sections with no file bytes, such as `.bss`, are zero-filled. The loader maps the interpreter (dynamic linker), resolves needed libraries, performs relocations, registers destructors, and finally transfers control to the entry point. The mental model: the file is a recipe for an address space; the loader turns that recipe into mappings with distinct protections. Understanding this explains why code pages are read-execute and data pages are read-write — the foundation of exploit mitigations.

### Method
1. Use `readelf -l` to list `LOAD` segments and flags.
2. Observe actual mappings via `/proc/<pid>/maps`.
3. Trace library resolution with `LD_DEBUG=libs`.
4. Find the entry point in `readelf -h` and disassemble `_start`.

### Example
In an authorized sandbox:
```bash
$ readelf -l <LAB>/demo | sed -n '/LOAD/,+1p'
  LOAD 0x000000 0x0000000000000000 0x0 0x628 0x628 R E 0x1000
  LOAD 0x002000 0x0000000000002000 0x0 0x2a8 0x2a8 R   0x1000
  LOAD 0x002df8 0x0000000000003df8 0x0 0x208 0x210 RW  0x1000
```
The first segment is executable; the last is writable — a classic NX layout.

| Phase | Action |
| --- | --- |
| Map | place segments |
| Relocate | fix addresses |
| Init | run constructors |
| Jump | enter `_start` |

### Common mistakes
Assuming the entry point equals `main`; forgetting that segment alignment can create gaps; ignoring the interpreter path in `INTERP`.

### Defense / verification
Compare `readelf -l` flags to `/proc/<pid>/maps` permissions. Any writable-and-executable mapping in your own binaries deserves scrutiny.

### Knowledge check
**Q:** Which program header type tells the loader to map a segment? **A:** `PT_LOAD`.

===MODULE===
TITLE: Imports, Exports, and the PLT/GOT
LEVEL: Intermediate
MINUTES: 45
SUMMARY: Trace how calls to shared libraries are resolved through the Procedure Linkage Table and Global Offset Table.
OBJECTIVES: explain PLT stubs and GOT entries | distinguish lazy and eager binding | identify imported APIs in disassembly
TAKEAWAYS: `call printf@plt` jumps through the GOT | the GOT holds resolved addresses | imports reveal program capabilities
PRACTICE: In an isolated lab, disassemble calls to `puts` and `printf`, then inspect `.plt` and `.got` with `objdump -R`.
SOURCES: None
---
## Core idea
Dynamically linked binaries do not know the final address of library functions until runtime. Calls therefore target a small stub in the `.plt` (Procedure Linkage Table), which jumps through an entry in the `.got` (Global Offset Table). Initially the GOT points back into the PLT so the dynamic linker can resolve the symbol on first use (**lazy binding**); afterwards the real address is written in. With `LD_BIND_NOW` or full RELRO, binding is eager. The mental model: the PLT is a trampoline and the GOT is a patchable pointer table. Imports are a high-value reversing signal because they summarize what the program can do (file access, networking, process creation).

### Method
1. List imports with `objdump -T` or `nm -D`.
2. Find `call <func>@plt` in disassembly.
3. Inspect the PLT stub to see which GOT slot it uses.
4. Use `objdump -R` to see relocation types for GOT entries.

### Example
In an authorized sandbox:
```bash
$ objdump -d -M intel <LAB>/demo | grep '@plt'
401036: call 401030 <puts@plt>
$ objdump -R <LAB>/demo | grep puts
0000000000003fd8 R_X86_64_JUMP_SLOT puts@GLIBC_2.2.5
$ gdb -q <LAB>/demo -ex 'x/gx 0x3fd8'
0x3fd8: 0x00007ffff7a2c210
```
The GOT slot now holds the resolved `puts` address.

| Term | Meaning |
| --- | --- |
| PLT | jump stub per imported function |
| GOT | table of resolved pointers |
| JUMP_SLOT | relocation for a GOT entry |

### Common mistakes
Assuming a PLT call reveals the callee's real address; ignoring that `LD_BIND_NOW` changes behavior; missing that stripped static binaries have no PLT.

### Defense / verification
Use GDB to watch GOT entries change after a call in your own program. Full RELRO makes the GOT read-only after relocation — check with `readelf -l`.

### Knowledge check
**Q:** What table holds the resolved address of an imported function? **A:** The GOT.

===MODULE===
TITLE: Relocations
LEVEL: Intermediate
MINUTES: 45
SUMMARY: Learn how the linker and loader patch addresses so code works regardless of load address.
OBJECTIVES: explain relative versus absolute relocations | read relocation entries | connect relocations to PIE
TAKEAWAYS: relocations are patch instructions for addresses | R_X86_64_PC32 is common in code | PIE requires many runtime relocations
PRACTICE: In an isolated lab, compile the same source with and without `-fPIE`, compare `readelf -r` output, and explain the difference.
SOURCES: None
---
## Core idea
A relocation is an instruction to the linker or loader: "at this offset, write this address in this format." Code that uses absolute addresses needs `R_X86_64_64`; position-independent code uses relative forms such as `R_X86_64_PC32`, where the stored value is `S + A - P` (symbol plus addend minus place). GOT-based references use `R_X86_64_JUMP_SLOT` and `R_X86_64_GLOB_DAT`. The mental model: compiled code contains placeholders; relocations are the recipe for filling them once final addresses are known. This is why the same executable can load at different addresses under ASLR.

### Method
1. List relocations with `readelf -r`.
2. Classify each by type and target offset.
3. Find the placeholder bytes in disassembly (often zeros).
4. Distinguish link-time (`.rel.text`) from runtime (`.rela.dyn`, `.rela.plt`) relocations.

### Example
In an authorized sandbox:
```bash
$ readelf -r <LAB>/demo | sed -n '/rela.dyn/,+4p'
Relocation section '.rela.dyn' at offset 0xdf8:
  Offset        Info        Type              Addend
  000000003fd0  000000000006 R_X86_64_GLOB_DAT  0
  000000003fd8  000000000007 R_X86_64_JUMP_SLOT 0
```

| Type | Meaning |
| --- | --- |
| R_X86_64_PC32 | 32-bit relative address |
| R_X86_64_64 | 64-bit absolute |
| R_X86_64_JUMP_SLOT | PLT/GOT lazy binding |
| R_X86_64_RELATIVE | base-relative PIE fixup |

### Common mistakes
Reading a relocated placeholder as a real address; assuming all relocations happen at load time; forgetting that PIE binaries have `RELATIVE` relocations.

### Defense / verification
Inspect your own binaries with `readelf -r` before and after enabling PIE. Document which references become relative — this directly affects exploitability.

### Knowledge check
**Q:** Which relocation type means a base-relative PIE fixup? **A:** `R_X86_64_RELATIVE`.

===MODULE===
TITLE: Static versus Dynamic Linking
LEVEL: Intermediate
MINUTES: 35
SUMMARY: Compare statically and dynamically linked binaries and understand their impact on analysis and symbols.
OBJECTIVES: build both link styles | recognize each from headers and imports | assess analysis trade-offs
TAKEAWAYS: static binaries embed library code | dynamic binaries rely on imported APIs | static binaries are larger but self-contained
PRACTICE: In an isolated lab, compile a small program with `-static` and dynamically, then compare size, sections, and `ldd` output.
SOURCES: None
---
## Core idea
Dynamic linking keeps library code out of the executable and resolves it at load time, producing small files with a PLT/GOT and a dependency list. Static linking copies the needed library code into the binary, producing a large, self-contained executable with no runtime dependencies and often a rich symbol table. The mental model: dynamic binaries are "addresses plus imports"; static binaries are "everything baked in." For reversing, dynamic imports quickly reveal capabilities; static binaries hide them among thousands of functions but often retain names that aid decompilation.

### Method
1. Check `file` and `ldd` on your own binaries.
2. Inspect imports with `nm -D` (dynamic) and symbols with `nm` (static).
3. Compare file sizes and section counts.
4. Look for embedded libc string tables in static builds.

### Example
In an authorized sandbox:
```bash
$ file <LAB>/dyn <LAB>/static
dyn:    ELF 64-bit PIE executable, dynamically linked
static: ELF 64-bit executable, statically linked
$ ldd <LAB>/dyn | head -2
  linux-vdso.so.1
  libc.so.6 => /lib/libc.so.6
$ ls -l <LAB>/dyn <LAB>/static
  16K dyn
 812K static
```

| Aspect | Dynamic | Static |
| --- | --- | --- |
| Size | small | large |
| Imports | visible via PLT/GOT | absent |
| Symbols | minimal | often rich |
| Dependencies | required | none |

### Common mistakes
Assuming `nm` shows dynamic symbols; expecting a PLT in a static binary; overlooking that static glibc leaves recognizable helper strings.

### Defense / verification
Use `file`, `ldd`, and `nm` together. When triaging your own samples, note that a static binary may be an attempt to reduce environmental visibility — a lead, not a verdict.

### Knowledge check
**Q:** Which link style typically has no PLT entries? **A:** Static linking.

===MODULE===
TITLE: Disassembly Fundamentals with objdump
LEVEL: Intermediate
MINUTES: 40
SUMMARY: Turn machine code into readable instructions and build a repeatable disassembly workflow.
OBJECTIVES: use objdump flags effectively | navigate by symbol and address | annotate disassembly into pseudo-code
TAKEAWAYS: `-d` disassembles text | `-M intel` clarifies operands | `-S` interleaves source when available
PRACTICE: In an isolated lab, disassemble your own binary to a text file and annotate one function line by line with comments.
SOURCES: None
---
## Core idea
Disassembly translates bytes into instructions linearly; it does not understand types or intent. `objdump` is the standard starting point on Linux. With `-d` it disassembles executable sections, `-M intel` selects readable operand order, `-S` mixes source lines when debug info exists, and `-r` shows relocation placeholders. The mental model: you are reading a sequence of state changes to registers and memory; your job is to group them into meaningful operations and name them. Because disassembly can be misaligned by embedded data or variable-length instructions, cross-check with control-flow information.

### Method
1. Dump to a file: `objdump -d -M intel <bin> > out.asm`.
2. Locate functions by symbol labels or by call targets.
3. Read prologue, body, and epilogue in order.
4. Annotate each block with a short source-like comment.

### Example
In an authorized sandbox:
```bash
$ objdump -d -M intel <LAB>/demo | sed -n '/<func>:/,/^$/p'
401126: push rbp
401127: mov rbp,rsp
40112a: mov DWORD PTR [rbp-0x4],edi
40112d: mov eax,DWORD PTR [rbp-0x4]
401130: add eax,0x2
401133: pop rbp
401134: ret
```
Annotation: `int func(int x){ return x + 2; }`.

| Flag | Use |
| --- | --- |
| `-d` | disassemble |
| `-M intel` | Intel syntax |
| `-S` | interleave source |
| `-r` | show relocations |

### Common mistakes
Trusting a single linear pass in data-heavy regions; confusing address with offset; skipping the calling convention when recovering parameters.

### Defense / verification
Cross-check each function's inferred signature against all call sites. Preserve annotated notes in your lab so future you can audit the reasoning.

### Knowledge check
**Q:** Which objdump flag selects Intel operand order? **A:** `-M intel`.

===MODULE===
TITLE: Ghidra Fundamentals
LEVEL: Intermediate
MINUTES: 50
SUMMARY: Set up a Ghidra project, import a binary, and use the Listing, Decompiler, and Symbol Tree effectively.
OBJECTIVES: import and analyze a sample | navigate cross-references | label functions and types
TAKEAWAYS: analysis auto-detects functions and signatures | the decompiler complements, never replaces, the listing | cross-references reveal callers
PRACTICE: In an isolated lab, import one of your own binaries into Ghidra, run Auto Analysis, and rename three functions with justified signatures.
SOURCES: None
---
## Core idea
Ghidra is a software reverse-engineering suite providing disassembly, decompilation, scripting, and collaboration. A **project** holds imported binaries; **Auto Analysis** performs function detection, embedded data discovery, and signature application. The **Listing** shows raw assembly, the **Decompiler** produces C-like pseudo-code, and the **Symbol Tree** organizes functions, labels, and data types. The mental model: Ghidra is a hypothesis machine — every name and type is an editable guess that you refine by following cross-references (XREFS) from interesting API calls back to callers.

### Method
1. Create a project and import the binary; note the language and compiler guess.
2. Run Auto Analysis and wait for completion.
3. Search the symbol tree or defined strings for interesting references.
4. Follow XREFS to callers, rename functions, and apply `void`/`int`, pointer types.
5. Keep the listing open beside the decompiler to validate each transformation.

### Example
In an authorized sandbox, Ghidra's decompiler pane shows:
```c
undefined8 FUN_00101130(undefined8 param_1) {
  char local_28 [32];
  gets(local_28);
  return 0;
}
```
The listing confirms the buffer is at `rbp-0x20` and the call target is `gets@plt`.

| Ghidra view | Best use |
| --- | --- |
| Listing | ground truth assembly |
| Decompiler | rapid overview |
| Symbol Tree | organization |
| XREFS | callers and data uses |

### Common mistakes
Trusting decompiler types without checking the listing; letting Auto Analysis finish without reviewing its language guess; renaming functions based on strings alone.

### Defense / verification
Record why each symbol was renamed and keep a screenshot or notes. For defensive work, Ghidra helps you understand your own code's compiled behavior — always within authorized scope.

### Knowledge check
**Q:** What Ghidra view shows who calls a function? **A:** Its cross-references (XREFS).

===MODULE===
TITLE: radare2 and rizin Fundamentals
LEVEL: Intermediate
MINUTES: 45
SUMMARY: Use a scriptable, terminal-first reverse-engineering framework for fast triage and repeatable analysis.
OBJECTIVES: open and analyze a binary in r2 | navigate with seek and print commands | use visual mode and scripting
TAKEAWAYS: `aaa` runs analysis | `pdf` prints the current function | commands compose into scripts
PRACTICE: In an isolated lab, open one of your own binaries with `r2 -A`, analyze the main function, and save a command script that reproduces your findings.
SOURCES: None
---
## Core idea
radare2 (and its fork rizin) is a terminal-centric reversing framework. It uses a virtual filesystem for binaries, a command language for analysis, and a scripting layer for automation. `r2 -A <bin>` opens and auto-analyzes; `aaa` triggers analysis manually; `afl` lists functions; `s main` seeks to a symbol; `pdf` prints the disassembled function; `pd 20` prints instructions; `px` dumps hex; `V` enters visual mode. The mental model: every action is a short command that can be recorded and replayed, making r2 ideal for repeatable triage and batch work across many own samples.

### Method
1. Open with `r2 -q -c 'aaa; afl' <bin>` for a quick function list.
2. Seek to a symbol with `s sym.main` and print with `pdf`.
3. Inspect data references with `axt` (cross-references to address).
4. Combine commands into an `.r2` script for automation.

### Example
In an authorized sandbox:
```bash
$ r2 -q -c 'aaa; s sym.main; pdf~call' <LAB>/demo
0x00401136  call sym.imp.printf
0x00401145  call sym.imp.exit
```
The `~call` filter shows only lines containing `call`.

| Command | Purpose |
| --- | --- |
| `aaa` | analyze all |
| `afl` | list functions |
| `pdf` | print current function |
| `px 64` | hex dump |
| `axt` | cross-references |

### Common mistakes
Skipping analysis and seeing only bytes; relying on symbol names that may be stripped; forgetting that command filters (`~`) are case-sensitive.

### Defense / verification
Save your command sequence and re-run it to confirm output is stable. When analyzing your own code, scripted checks can catch unexpected calls to dangerous APIs.

### Knowledge check
**Q:** Which r2 command prints the function at the current offset? **A:** `pdf`.

===MODULE===
TITLE: Decompilation and Its Limits
LEVEL: Intermediate
MINUTES: 40
SUMMARY: Use decompiled C-like output wisely by understanding where it accurately reflects machine code and where it guesses.
OBJECTIVES: explain what decompilers infer | validate output against assembly | recognize common failure modes
TAKEAWAYS: decompilation reconstructs intent, not source | types and loop shapes are guesses | the listing is ground truth
PRACTICE: In an isolated lab, decompile one of your own functions, then deliberately alter a type in the decompiler and observe how the output changes.
SOURCES: None
---
## Core idea
A decompiler lifts machine code to C-like pseudo-code by analyzing control flow, stack slots, and data types. It is powerful but lossy: original variable names, comments, and exact types are gone; structs may be flattened; optimized loops may look unlike any source you would write. The mental model: decompiler output is a **readable hypothesis**. Every claim it makes should be traceable back to instructions. Cases that commonly mislead include tail calls, switch tables, bit-field tricks, SIMD code, and hand-written assembly. Treat the decompiler as an accelerator for forming questions, then answer them in the listing.

### Method
1. Read the decompiled function for an overview and guess a signature.
2. Verify argument sources against the calling convention in assembly.
3. Check each branch and loop against the raw jumps.
4. Correct types (pointer versus int, array versus scalar) and observe improvements.
5. Document remaining uncertainty rather than forcing a clean story.

### Example
```c
/* decompiler guess */
int check(char *s) { return strcmp(s, "<LAB>") == 0; }
```
The listing reveals `call strcmp` then `test eax,eax; sete al` — confirming the equality check. Without the import name, the decompiler would have shown only `FUN_00401210`.

| Trust level | Element |
| --- | --- |
| High | call targets, branches |
| Medium | local variable roles |
| Low |struct layout, variable names |

### Common mistakes
Pasting decompiler output as ground truth in a report; assuming a `for` loop means a literal C `for`; ignoring optimizations that inline functions.

### Defense / verification
For any conclusion used in defense (e.g., signature development), cite the exact address and instruction. This makes findings auditable and avoids false confidence.

### Knowledge check
**Q:** What should you do when a decompiler's loop shape looks odd? **A:** Check the raw branch instructions in the listing.

===MODULE===
TITLE: Symbols, Stripping, and Symbol Recovery
LEVEL: Intermediate
MINUTES: 40
SUMMARY: Understand where names come from, what stripping removes, and how to recover function boundaries heuristically.
OBJECTIVES: distinguish symtab from dynsym | describe strip effects | apply basic function-boundary heuristics
TAKEAWAYS: dynamic symbols survive stripping for imported APIs | local names are usually removed | call targets and prologues reveal functions
PRACTICE: In an isolated lab, copy one of your own binaries, strip one copy, and compare `nm`, `readelf -s`, and disassembler output.
SOURCES: None
---
## Core idea
Symbols are named addresses. ELF uses `.symtab` (full, used by linkers and debuggers) and `.dynsym` (minimal, used at runtime). `strip` removes `.symtab` and debug sections but keeps `.dynsym`, so imported functions like `printf` remain visible while local names disappear. Debug builds with `-g` add DWARF information containing variable names and line numbers. The mental model: stripping removes the *map*, not the *territory* — the code and its behavior are unchanged, only labels vanish. Recovery means re-deriving labels from structure: call targets, standard prologues, exception tables, and string cross-references.

### Method
1. Compare `nm <bin>` and `nm -D <bin>` before and after stripping.
2. List dynamic symbols with `readelf --dyn-syms`.
3. Collect all call targets in disassembly as candidate function starts.
4. Look for prologue byte patterns (`55 48 89 e5`, `endbr64`) and alignment padding.

### Example
In an authorized sandbox:
```bash
$ nm <LAB>/demo | head -3
0000000000001139 t func
0000000000001140 T main
$ cp <LAB>/demo <LAB>/demo.stripped && strip <LAB>/demo.stripped
$ nm <LAB>/demo.stripped
nm: no symbols
$ nm -D <LAB>/demo.stripped | grep puts
0000000000000000 U puts@GLIBC_2.2.5
```

| Symbol table | Survives strip? | Contents |
| --- | --- | --- |
| `.symtab` | no | all local/global names |
| `.dynsym` | yes | imported/exported names |
| DWARF | no | types, lines, vars |

### Common mistakes
Assuming a stripped binary has no useful names; trusting auto-generated `FUN_xxxx` names as meaningful; ignoring that static binaries may keep many symbols.

### Defense / verification
Keep unstripped builds of your own software for debugging and ship stripped ones. Verify that exported symbols in your libraries are intentional — unnecessary exports enlarge the attack surface.

### Knowledge check
**Q:** Which symbol table remains after `strip`? **A:** `.dynsym` (dynamic symbols).

===MODULE===
TITLE: Function Identification and Signatures
LEVEL: Intermediate
MINUTES: 45
SUMMARY: Recover function starts, argument counts, and roles in stripped binaries using structural evidence.
OBJECTIVES: detect function boundaries | infer argument counts | recognize compiler-generated helpers
TAKEAWAYS: call targets mark real function entries | register usage reveals argument counts | prologues and epilogues bound functions
PRACTICE: In an isolated lab, strip a self-compiled binary, then reconstruct three function signatures from disassembly and verify against the original source.
SOURCES: None
---
## Core idea
Identifying a function means finding its entry, extent, and interface. Entries appear as call targets, jump-table destinations, or exported symbol addresses. Extents end at `ret` plus padding or at the next entry. Interface inference uses the calling convention: count distinct incoming registers (`rdi`, `rsi`, `rdx`, ...) used before being defined, and identify the return register (`rax`, or `xmm0` for floats). Compiler-generated helpers such as stack-check routines (`__stack_chk_fail`) and constructors have recognizable shapes. The mental model: combine multiple weak signals into a confident boundary — no single heuristic is reliable alone.

### Method
1. Collect every direct `call` target and sort addresses.
2. Inspect bytes before each target for alignment padding (`cc` or `90`).
3. Identify reads of incoming argument registers before writes.
4. Find the `ret`/`jmp` that closes the function.
5. Name the function only when behavior plus callers agree.

### Example
In an authorized sandbox:
```bash
$ objdump -d -M intel <LAB>/s | grep -oE 'call +[0-9a-f]+' | sort -u
call 401020
call 401150
$ objdump -d -M intel <LAB>/s | sed -n '/401150:/,+12p'
401150: push rbp
401151: mov rbp,rsp
401154: mov DWORD PTR [rbp-0x4],edi   ; arg1
401157: mov DWORD PTR [rbp-0x8],esi   ; arg2
40115a: mov eax,DWORD PTR [rbp-0x4]
40115d: add eax,DWORD PTR [rbp-0x8]
401160: pop rbp
401161: ret
```
Inferred: `int f(int a, int b)`.

| Evidence | Strength |
| --- | --- |
| Call target | strong |
| Prologue pattern | medium |
| String reference | supporting |
| Naming from strings | weak |

### Common mistakes
Splitting at every `ret` in tail-call code; assuming one argument per used register without checking writes; naming functions solely from adjacent strings.

### Defense / verification
Write your inferred signature into comments and check it against a recompilation or a debug build. In authorized assessments, uncertainty should be stated explicitly.

### Knowledge check
**Q:** What is the strongest evidence that an address is a function entry? **A:** It is the target of a direct call.

===MODULE===
TITLE: Debugging with GDB
LEVEL: Intermediate
MINUTES: 45
SUMMARY: Use GDB to control execution, inspect state, and confirm hypotheses formed during disassembly.
OBJECTIVES: set breakpoints and step | inspect registers and memory | connect breakpoints to code paths
TAKEAWAYS: `break` on symbols or addresses | `x/` examines memory with format and width | stepping confirms dynamic behavior
PRACTICE: In an isolated lab, debug your own binary to a breakpoint on a parsing function, record argument values, and compare them to disassembly assumptions.
SOURCES: None
---
## Core idea
A debugger runs a program under your control so you can stop at chosen points and inspect real state. GDB is the standard Linux debugger. `break *0x401136` or `break func` sets breakpoints; `run` starts; `next` steps over calls; `step` enters them; `continue` resumes; `info registers` and `x/16gx $rsp` show state. The mental model: static analysis proposes what a function does; dynamic analysis lets you *watch it happen*. Always run debuggers on your own binaries or explicitly authorized targets inside an isolated environment.

### Method
1. Start GDB with your binary and set a breakpoint at an interesting call.
2. Run with representative input.
3. At the stop, inspect arguments (`rdi`, `rsi`, ...) and stack.
4. Step through the function and watch how values change.
5. Compare the observed path with the disassembly graph.

### Example
In an authorized sandbox:
```bash
$ gdb -q <LAB>/demo
(gdb) break *0x401159
Breakpoint 1 at 0x401159
(gdb) run <LAB>/input.txt
Breakpoint 1, 0x0000000000401159 in func ()
(gdb) x/s $rdi
0x7fffffffdf00: "<LAB>/input.txt"
(gdb) info registers rax rdi
rax  0x0
rdi  0x7fffffffdf00
```

| Command | Effect |
| --- | --- |
| `b *addr` | breakpoint at address |
| `n` / `s` | step over / into |
| `x/s` | show C string |
| `bt` | backtrace |

### Common mistakes
Confusing `next` with `step` at call sites; inspecting a stack address after the frame was destroyed; forgetting PIE offsets differ from runtime addresses.

### Defense / verification
Confirm PIE base with `info proc mappings`, then compute runtime addresses as base plus offset. Keep a log of observed values to support conclusions.

### Knowledge check
**Q:** Which GDB command shows a C string at an address? **A:** `x/s <address>`.

===MODULE===
TITLE: Advanced Debugging: Watchpoints and Scripting
LEVEL: Advanced
MINUTES: 50
SUMMARY: Apply hardware watchpoints, conditional breakpoints, and batch scripts to trace data flow efficiently.
OBJECTIVES: set watchpoints on memory and registers | use conditional breakpoints | automate GDB with command files
TAKEAWAYS: watchpoints stop when data changes | conditional breakpoints filter noise | scripts make analysis reproducible
PRACTICE: In an isolated lab, write a GDB command script that runs your own binary, breaks on a function, and logs its argument on every call.
SOURCES: None
---
## Core idea
Breakpoints stop on *execution*; watchpoints stop on *data access*. GDB offers `watch expr` (write), `awatch` (read or write), and `rwatch` (read), often implemented with debug registers and thus limited in number. Conditional breakpoints (`break foo if x > 5`) avoid manual repetition. GDB command files (`-x script.gdb`) and Python scripting turn a manual session into a repeatable experiment. The mental model: choose the right *trigger* — instruction reached or data touched — then automate the observation.

### Method
1. Identify the variable or memory slot you care about.
2. Set a watchpoint on it: `watch *(int*)0x7fffffffdf00` or `watch var`.
3. Add a condition to reduce stops.
4. Use `commands` blocks to log state automatically.
5. Save the whole sequence in a `.gdb` file.

### Example
In an authorized sandbox:
```bash
$ gdb -q -x <LAB>/trace.gdb <LAB>/demo
(gdb) cat <LAB>/trace.gdb
break func
commands
  silent
  printf "arg=%d\n", $edi
  continue
end
run
```
Output: `arg=1`, `arg=2`, `arg=3` — every call logged without manual stepping.

| Feature | Syntax | Stops on |
| --- | --- | --- |
| watchpoint | `watch expr` | write |
| access watch | `awatch expr` | read/write |
| conditional bp | `b f if cond` | matching hits |
| commands | `commands N` | automated action |

### Common mistakes
Setting too many hardware watchpoints; conditions that call functions with side effects; forgetting `silent` makes logs noisy.

### Defense / verification
Re-run scripts against a second input to confirm stable behavior. On Windows labs, x64dbg offers equivalent breakpoints, watchpoints (`Hardware Access`), and scripting for the same workflow.

### Knowledge check
**Q:** Which GDB command stops when a memory location is written? **A:** `watch`.

===MODULE===
TITLE: Stack Buffer Overflow: Controlled Lab
LEVEL: Advanced
MINUTES: 50
SUMMARY: Observe how an unbounded copy overwrites adjacent stack data in a purpose-built, isolated lab binary.
OBJECTIVES: identify a vulnerable copy loop | demonstrate overwrite of a local variable | explain the mechanism without deploying anything
TAKEAWAYS: fixed-size stack buffers have neighbors | bounds checks prevent spill | this work stays in authorized labs
PRACTICE: In an isolated sandbox with a self-written vulnerable program, use long input to overwrite a local flag variable and document the exact offset.
SOURCES: None
---
## Core idea
A stack buffer overflow occurs when a write to a fixed-size local buffer continues past its end into adjacent stack memory. In a lab program, a 32-byte buffer followed by an integer can be overflowed so the integer changes. The mental model: the stack is a row of slots; a write with no length limit behaves like paint spilling into the next slot. We study this only in self-authored binaries inside an isolated sandbox to understand root cause and validation — never to target real systems. The defensive lesson is that input length must be checked against the destination capacity, not the source.

### Method
1. Compile a lab program with `gets` or an unchecked `memcpy` and frame pointers enabled.
2. Disassemble to find the buffer's offset from RBP.
3. Send increasing input lengths and record which local changes.
4. Confirm with a debugger that bytes land where predicted.

### Example
In an authorized sandbox:
```bash
(gdb) x/12bx $rbp-0x20
0x7fffffffdf00: 0x41 0x41 0x41 0x41 0x41 0x41 0x41 0x41
0x7fffffffdf08: 0x41 0x41 0x41 0x41 0x42 0x42 0x42 0x42
(gdb) p/x *(int*)($rbp-0x4)
$1 = 0x42424242
```
Bytes at offset 36 onward overwrote the local flag.

| Offset | Content |
| --- | --- |
| rbp-0x20 .. rbp-0x01 | 32-byte buffer |
| rbp-0x04 | adjacent int |
| rbp+0x08 | return address |

### Common mistakes
Assuming a fixed escape distance when mitigations change layout; forgetting compiler padding; testing outside an isolated lab.

### Defense / verification
Fix the lab program with `fgets(buf, sizeof buf, stdin)` and re-run identical input: the flag stays unchanged. Add a regression test that feeds oversized input.

### Knowledge check
**Q:** What bounds check prevents a stack overflow in a copy? **A:** Compare input length to destination size before copying.

===MODULE===
TITLE: Control-Flow Hijack Concepts in the Lab
LEVEL: Advanced
MINUTES: 50
SUMMARY: Understand how overflowing a saved return address can redirect execution, studied only on a purpose-built lab binary.
OBJECTIVES: locate the saved return address | explain the overwrite mechanism | describe mitigations that block it
TAKEAWAYS: `[rbp+8]` holds the return address | control of it means control of RIP | canaries and ASLR are direct countermeasures
PRACTICE: In an isolated sandbox, use a debugger to overwrite the return address of your own lab program with the address of a harmless `win()` function and observe the call.
SOURCES: None
---
## Core idea
When a stack overflow reaches the saved return address at `[rbp+8]`, the eventual `ret` loads that value into RIP. Redirecting it to an existing function in the same binary is the simplest demonstration of control-flow hijack. We do this **only** on a binary we wrote, in an isolated sandbox, to learn how the mechanism works and why defenses exist. The mental model: `ret` is just `pop rip` — if the popped value is attacker-influenced, execution follows it. Real deployments are protected by stack canaries, ASLR, NX, and PIE, so this is a teaching model, not a deployable technique.

### Method
1. Find the buffer-to-return distance in disassembly (e.g., 40 bytes).
2. Determine the address of a harmless target function in your lab binary.
3. Supply input consisting of padding plus the target address in little-endian.
4. Run under GDB and confirm the redirect with a breakpoint on the target.

### Example
In an authorized sandbox:
```bash
(gdb) x/gx $rbp+8
0x7fffffffe028: 0x0000000000401176
(gdb) set {unsigned long}($rbp+8) = 0x401160   # lab-only demonstration
(gdb) continue
Breakpoint 2, 0x0000000000401160 in win ()
```
The debugger shows execution landing in `win()`, proving the return address controls RIP.

| Offset | Value |
| --- | --- |
| 0-31 | buffer contents |
| 32-39 | padding / saved RBP |
| 40-47 | return address |

### Common mistakes
Forgetting little-endian byte order in input; ignoring stack alignment requirements; testing against any system you do not own or have explicit authorization for.

### Defense / verification
Recompile the lab program with `-fstack-protector-all -pie` and rerun: the canary aborts before `ret`. Document the difference as the defensive payoff.

### Knowledge check
**Q:** What does `ret` effectively do with the value at `[rsp]`? **A:** Pops it into RIP.

===MODULE===
TITLE: Format String Vulnerabilities in the Lab
LEVEL: Advanced
MINUTES: 45
SUMMARY: Learn how user-controlled format strings can read or write memory, using only a self-authored isolated program.
OBJECTIVES: explain variadic argument handling | demonstrate reading stack values via `%p` | describe the fix
TAKEAWAYS: printf treats its first argument as a format | missing argument types let reads walk the stack | pass user input as data, not format
PRACTICE: In an isolated sandbox, feed format specifiers to your own lab program to observe stack values, then fix the call to `printf("%s", input)`.
SOURCES: None
---
## Core idea
Variadic functions like `printf` obtain extra arguments from registers and the stack according to the format string. If the format string itself is user-controlled, extra specifiers make `printf` interpret whatever happens to be in those positions as arguments. `%p` reveals pointer-like values; `%s` dereferences them. The `%n` specifier writes a count to a pointer — dangerous conceptually, and we discuss it only as a reason to fix the bug. The mental model: the format string is a small instruction language, and letting an attacker write it blurs the line between code and data. All experiments here use your own binary in an isolated sandbox.

### Method
1. Write a lab program calling `printf(argv[1])`.
2. Run with `%p %p %p %p` and observe printed values.
3. In GDB, compare the values with registers/stack at the call.
4. Replace with `printf("%s", argv[1])` and verify nothing leaks.

### Example
In an authorized sandbox:
```bash
$ <LAB>/fmt "%p %p %p %p"
0x7ffff7a12340 0x401234 0x7fffffffdf00 0x2
```
In GDB, `x/gx $rsi` and the stack show the same values, confirming the read path.

| Specifier | Effect |
| --- | --- |
| `%p` | prints a pointer value |
| `%s` | reads a string from pointer |
| `%n` | writes count (do not use) |

### Common mistakes
Assuming positional arguments are harmless; forgetting that format bugs can write, not just read; testing on anything outside your own lab.

### Defense / verification
Use constant format strings and pass user data as arguments. Enable `-Wformat-security` and fuzz the parser with format-like inputs in your own CI.

### Knowledge check
**Q:** Why is `printf(user_input)` unsafe? **A:** The input controls format specifiers, causing reads/writes of unintended memory.

===MODULE===
TITLE: Use-After-Free in the Lab
LEVEL: Advanced
MINUTES: 45
SUMMARY: Understand dangling pointers and how reallocation can reuse freed memory, using an isolated purpose-built program.
OBJECTIVES: describe allocator free/reuse behavior | identify a dangling pointer in source | explain safe ownership patterns
TAKEAWAYS: free does not erase pointers | freed chunks can be reallocated to other data | ownership discipline prevents UAF
PRACTICE: In an isolated sandbox with your own lab binary, trigger a use-after-free and use a debugger to show the same address being reused by a second allocation.
SOURCES: None
---
## Core idea
A use-after-free (UAF) happens when a program keeps a pointer to memory it has already freed. The allocator marks the chunk available and may hand the same address to a later allocation. If the stale pointer is then dereferenced, it reads or writes whatever now occupies that address. The mental model: pointer values are just addresses; freeing invalidates the *meaning* but not the *number*. Study this only with a program you wrote in an isolated sandbox. The defensive lesson is ownership: after `free`, set pointers to NULL and avoid multiple aliases with unclear lifetime.

### Method
1. Write a lab program that allocates a struct, frees it, then uses the pointer.
2. Add a second allocation between the free and the use.
3. Under GDB, print both pointers to confirm they are equal.
4. Observe how the stale dereference now touches the new object's bytes.

### Example
In an authorized sandbox:
```bash
(gdb) break 12      # after first free and reallocation
(gdb) p p
$1 = (obj *) 0x5555555592a0
(gdb) p q
$2 = (obj *) 0x5555555592a0
(gdb) x/4gx p
0x5555555592a0: 0x4141414141414141 0x0000000000000002
```
Both pointers alias the same recycled chunk.

| Event | State |
| --- | --- |
| malloc p | chunk owned by p |
| free p | chunk available |
| malloc q | same chunk reused |
| use p | stale access |

### Common mistakes
Assuming freed memory is zeroed; ignoring aliasing through multiple pointers; conflating UAF with a simple null dereference.

### Defense / verification
Use sanitizers (`-fsanitize=address`) on your own code to detect UAF automatically. Verify the fix by nulling pointers and re-running the same lab input.

### Knowledge check
**Q:** Does `free(p)` change the numeric value stored in `p`? **A:** No; it only invalidates the allocation.

===MODULE===
TITLE: Heap Overflow in the Lab
LEVEL: Advanced
MINUTES: 50
SUMMARY: Examine how a write past a heap allocation corrupts allocator metadata or neighboring chunks in an isolated sandbox.
OBJECTIVES: describe chunk headers and neighboring allocations | demonstrate metadata corruption | explain detection via guards
TAKEAWAYS: heap chunks carry size metadata | overflow can reach the next chunk | guarded allocations and bounds checks help
PRACTICE: In an isolated lab with your own program, overflow one heap buffer into an adjacent chunk and note the corrupted size field with a debugger.
SOURCES: None
---
## Core idea
Heap allocations come from an arena that carves memory into chunks with metadata (size, flags) stored adjacent to user data. A heap overflow writes beyond the requested size and can damage that metadata or the next chunk's contents. The mental model: unlike the stack, heap neighbors are determined by allocation order and allocator policy, so layout must be observed, not assumed. All work here is on self-authored binaries in an isolated sandbox. The defensive point is that correct length tracking and safe APIs matter more on the heap because corruption may surface far from the faulty write.

### Method
1. Allocate two buffers back-to-back in a lab program.
2. Find their addresses in GDB and note the chunk header before each.
3. Fill the first buffer past its size and observe the second's bytes change.
4. Continue execution to see how the allocator reacts to corrupted metadata.

### Example
In an authorized sandbox:
```bash
(gdb) p/x a
$1 = 0x5555555592a0
(gdb) p/x b
$2 = 0x555555559310
(gdb) x/2gx a-0x10
0x555555559290: 0x0000000000000000 0x0000000000000041
(gdb) x/2gx b-0x10
0x555555559300: 0x4141414141414141 0x4141414141414141
```
The `0x41` size header of chunk `b` was overwritten with `0x41`...`A` patterns from the overflow.

| Structure | Role |
| --- | --- |
| prev_size / size | chunk metadata |
| user data | requested buffer |
| next chunk | possible victim |

### Common mistakes
Assuming deterministic layout across allocator versions; mistaking a library abort for a clean detection; running experiments outside an isolated lab.

### Defense / verification
Enable ASan (`-fsanitize=address`) which inserts redzones and reports the overflowing write immediately, and add explicit length checks in your code.

### Knowledge check
**Q:** Where is a glibc heap chunk's size metadata relative to the user pointer? **A:** Immediately before the user data (in the chunk header).

===MODULE===
TITLE: Heap Metadata and tcache Concepts
LEVEL: Advanced
MINUTES: 50
SUMMARY: Understand modern allocator caches and why metadata integrity matters, studied purely in isolated lab conditions.
OBJECTIVES: explain tcache fast bins conceptually | identify linked-list metadata | describe integrity checks in current glibc
TAKEAWAYS: freed chunks are stored in per-size lists | list pointers live in freed user data | glibc adds key and alignment checks
PRACTICE: In an isolated sandbox with your own program, inspect freed chunks with GDB to see tcache list pointers, then verify that current glibc detects double-free corruption.
SOURCES: None
---
## Core idea
Modern glibc uses a per-thread **tcache** for recently freed chunks, storing them in singly linked lists indexed by size. The forward pointer (`next`) and a key are kept in the freed chunk's user area. Because these pointers live in writable memory, corrupting them can misdirect the allocator — a major reason glibc now includes double-free detection, key checks, and alignment assertions. The mental model: the allocator maintains its own data structures *inside* the memory it manages, so application bugs and allocator bookkeeping share space. Our focus is understanding and verifying these checks in a lab, not bypassing them.

### Method
1. Allocate and free several same-sized chunks in a lab program.
2. In GDB, inspect the first 16 bytes of a freed chunk to see `next` and `key`.
3. Observe that the pointer targets another freed chunk of the same size class.
4. Trigger a double-free in the lab and note glibc's abort message.

### Example
In an authorized sandbox:
```bash
(gdb) x/2gx 0x5555555592a0
0x5555555592a0: 0x0000000000555290 0x0000555555559000
(gdb) continue
free(): double free detected in tcache 2
```
The first word is the `next` pointer; the second is the tcache key used for detection.

| Field | Location | Purpose |
| --- | --- | --- |
| next | chunk+0 | next freed chunk |
| key | chunk+8 | double-free guard |
| size | chunk-8 | size class |

### Common mistakes
Assuming tcache layout is stable across glibc versions; treating an abort as absence of a bug; experimenting outside authorized lab boundaries.

### Defense / verification
Keep glibc updated to retain integrity checks, and use ASan during development. Verify your own code never double-frees by running sanitizer-enabled tests.

### Knowledge check
**Q:** What field helps glibc detect a double free in tcache? **A:** The tcache `key` stored in the freed chunk.

===MODULE===
TITLE: NX / DEP and the ROP Idea
LEVEL: Intermediate
MINUTES: 45
SUMMARY: Understand why executable code and writable data are separated, and what return-oriented programming means conceptually.
OBJECTIVES: read NX flags in headers | explain why shellcode on the stack fails | describe ROP at a conceptual level
TAKEAWAYS: stacks are non-executable by default | data-only writes cannot create instructions | ROP reuses existing executable gadgets
PRACTICE: In an isolated lab, compile a binary with and without `-z execstack`, inspect segment flags, and confirm the difference with `readelf -l`.
SOURCES: None
---
## Core idea
NX (No eXecute), called DEP on Windows, marks data pages such as the stack and heap as non-executable. A process may *write* there but not *execute*, so injecting raw instructions into a buffer does not create runnable code. The mental model: memory has two independent permissions — writable and executable — and modern toolchains keep them disjoint. Attackers responded conceptually with **return-oriented programming**: chaining short instruction sequences ("gadgets") that already exist in executable pages by controlling return addresses. We cover ROP only as a concept for assessment, not as a deployable technique. The defensive takeaway is that NX shifts the attacker from injecting code to reusing it, and control-flow protections are needed next.

### Method
1. Check segment flags with `readelf -l`: stack should be `RW`, text `R E`.
2. Note that `GNU_STACK` with `E` means executable stack.
3. For assessment, ask: is any writable+executable region present?
4. Recognize that gadgets are `ret`-ending sequences in existing code.

### Example
In an authorized sandbox:
```bash
$ readelf -l <LAB>/demo | grep GNU_STACK
  GNU_STACK 0x0 0x0 0x0 0x0 0x0 RW  0x10
$ readelf -l <LAB>/bad | grep GNU_STACK
  GNU_STACK 0x0 0x0 0x0 0x0 0x0 RWE 0x10
```
The second binary deliberately uses `-z execstack` in the lab.

| Flag | Meaning |
| --- | --- |
| R E | readable, executable (code) |
| RW | readable, writable (data) |
| RWE | unsafe combination |

### Common mistakes
Assuming NX alone prevents control-flow hijack; forgetting JIT regions may be W^X exceptions; ignoring that gadgets exist in libraries too.

### Defense / verification
Build all lab binaries with default NX and verify no `RWE` segments. When assessing a bug, state clearly that NX raises the bar but does not eliminate risk.

### Knowledge check
**Q:** What does an `RWE` GNU_STACK flag indicate? **A:** An executable stack, which weakens NX.

===MODULE===
TITLE: Stack Canaries
LEVEL: Intermediate
MINUTES: 40
SUMMARY: Learn how stack protector values detect overwritten return addresses before a function returns.
OBJECTIVES: locate canary checks in disassembly | explain TLS canary generation | describe failure behavior
TAKEAWAYS: canaries sit between locals and saved state | checks occur just before `ret` | `__stack_chk_fail` terminates the process
PRACTICE: In an isolated lab, compile a lab program with and without `-fstack-protector-all`, overflow a local buffer, and compare the outcomes.
SOURCES: None
---
## Core idea
A stack canary is a random value placed between local buffers and the saved return address. The compiler copies it from a thread-local storage value at function entry and checks it before returning. If an overflow reaches the canary, the check fails and `__stack_chk_fail` aborts the process — turning a silent control-flow hijack into a loud crash. The mental model: the canary is a tripwire, not a wall; it detects certain overflows rather than preventing them. Canaries do not protect heap corruption or writes that skip the canary, and they are ineffective if the value can be leaked.

### Method
1. Look for a read of `fs:0x28` (TLS canary) in the prologue.
2. Note the canary stored at `[rbp-0x8]` or similar.
3. Find the comparison just before `ret`, followed by a call to `__stack_chk_fail`.
4. Compare builds with and without `-fstack-protector-all`.

### Example
In an authorized sandbox:
```bash
$ objdump -d -M intel <LAB>/protected | sed -n '/<vuln>:/,/ret/p'
401140: mov rax,QWORD PTR fs:0x28
401149: mov QWORD PTR [rbp-0x8],rax
...
401180: mov rax,QWORD PTR [rbp-0x8]
401184: sub rax,QWORD PTR fs:0x28
40118d: jne 401194 <call __stack_chk_fail>
```

| Build flag | Effect |
| --- | --- |
| `-fstack-protector-strong` | protects risky functions |
| `-fstack-protector-all` | protects every function |
| `-fno-stack-protector` | none (lab only) |

### Common mistakes
Assuming canaries protect all memory corruption; ignoring that information leaks can reveal the value; forgetting they require compiler support.

### Defense / verification
Enable strong stack protection in your builds and verify the canary check exists in disassembly. Confirm a deliberate lab overflow aborts cleanly rather than hijacking control.

### Knowledge check
**Q:** Where is the canary value sourced from on x86-64 Linux? **A:** Thread-local storage at `fs:0x28`.

===MODULE===
TITLE: Address Space Layout Randomization (ASLR)
LEVEL: Intermediate
MINUTES: 40
SUMMARY: Understand how randomizing load addresses raises the cost of exploitation and how to assess it honestly.
OBJECTIVES: observe ASLR across runs | explain which regions are randomized | describe entropy limits
TAKEAWAYS: stack, heap, libraries, and PIE base move per run | ASLR does not fix memory bugs | leaks reduce its value
PRACTICE: In an isolated lab, run your own binary twice under GDB and compare stack, heap, and libc base addresses.
SOURCES: None
---
## Core idea
ASLR randomizes the addresses of the stack, heap, shared libraries, and (with PIE) the executable itself. The mental model: even if an attacker can write a pointer, they may not know what valid address to write — ASLR turns certainty into a guessing game. It is a *mitigation*, not a cure: the underlying bug remains, and any information disclosure that reveals a base address weakens it. Entropy differs by region and platform; 32-bit systems offer far less. Disabling ASLR (`setarch -R`) is useful in a lab for stable experiments but must never be treated as a production posture.

### Method
1. Run the binary under GDB twice and record `info proc mappings`.
2. Compare base addresses for libc, heap, and stack.
3. Enable/disable with `sysctl kernel.randomize_va_space` in your lab only.
4. For assessment, note whether a leak primitive exists in the bug you are evaluating.

### Example
In an authorized sandbox:
```bash
$ for i in 1 2; do gdb -q -batch -ex start -ex 'info proc mappings' <LAB>/demo \
    | grep libc; done
0x7ffff7dcb000  /lib/x86_64-linux-gnu/libc.so.6
0x7ffff78a1000  /lib/x86_64-linux-gnu/libc.so.6
```
The libc base differs between runs.

| Region | Randomized with |
| --- | --- |
| stack | ASLR |
| heap | ASLR |
| libraries | ASLR |
| executable | PIE + ASLR |

### Common mistakes
Claiming a bug is unexploitable solely because ASLR is on; ignoring partial-overwrite or leak techniques conceptually; disabling ASLR outside a controlled lab.

### Defense / verification
Verify ASLR is enabled on your systems and that your binaries are PIE. In reports, describe ASLR as raising complexity, not eliminating impact.

### Knowledge check
**Q:** Does ASLR remove a memory corruption bug? **A:** No; it only randomizes addresses and raises exploitation cost.

===MODULE===
TITLE: Position-Independent Executables (PIE)
LEVEL: Intermediate
MINUTES: 35
SUMMARY: Learn how PIE lets the main executable load at a random address and what that means for static analysis.
OBJECTIVES: identify PIE in ELF headers | convert between file offsets and runtime addresses | explain ET_EXEC versus ET_DYN
TAKEAWAYS: PIE binaries are ELF type DYN | runtime addresses equal base plus static offset | code references become relative
PRACTICE: In an isolated lab, compile with and without `-fPIE -pie`, inspect ELF type, and compute three runtime addresses using GDB's base.
SOURCES: None
---
## Core idea
A PIE can be loaded at any address because its code uses relative references. In ELF terms it is `ET_DYN`, like a shared library, with a small load base rather than a fixed one. For reverse engineering, addresses in `objdump` are *offsets* from the base; the runtime address is `base + offset`. GDB handles this automatically when a symbol is loaded, but when you set a raw breakpoint you must add the base. The mental model: PIE makes the whole program a movable block; internal distances stay constant, only the origin shifts.

### Method
1. Check `readelf -h`: Type `DYN` with an interpreter indicates PIE.
2. Note the `Entry point` is a small offset like `0x1040`.
3. In GDB, get the base from `info proc mappings` (first mapping).
4. Compute `runtime = base + offset` for manual breakpoints.

### Example
In an authorized sandbox:
```bash
$ readelf -h <LAB>/demo | grep Type
  Type: DYN (Position-Independent Executable)
(gdb) info proc mappings | head -3
0x555555554000 0x555555555000  /LAB/demo
(gdb) break *0x555555555139     # 0x1139 + base 0x555555554000
```

| Property | non-PIE | PIE |
| --- | --- | --- |
| ELF type | EXEC | DYN |
| Code refs | absolute | relative |
| ASLR for code | no | yes |

### Common mistakes
Using static offsets as runtime addresses; assuming `main` is at the entry point; forgetting PIE plus ASLR breaks hardcoded-address assumptions.

### Defense / verification
Build your own binaries as PIE by default and verify with `readelf -h`. In analysis notes, always label an address as "offset" or "runtime."

### Knowledge check
**Q:** For a PIE loaded at base 0x555555554000, what is the runtime address of offset 0x1139? **A:** 0x555555555139.

===MODULE===
TITLE: RELRO and GOT Hardening
LEVEL: Intermediate
MINUTES: 35
SUMMARY: Understand partial and full RELRO and how they protect the GOT from overwrite in your own binaries.
OBJECTIVES: identify RELRO in program headers | explain lazy binding trade-off | check GOT permissions at runtime
TAKEAWAYS: partial RELRO protects some metadata | full RELRO makes the GOT read-only | lazy binding is disabled by full RELRO
PRACTICE: In an isolated lab, compile with `-Wl,-z,relro,-z,now`, inspect `readelf -l`, and verify the GOT mapping becomes read-only after startup.
SOURCES: None
---
## Core idea
RELRO (Read-Only Relocation) hardens the dynamic linking tables. **Partial RELRO** makes some sections read-only but leaves the `.got.plt` writable to support lazy binding. **Full RELRO** resolves all symbols at startup and marks the entire GOT read-only, so an overwrite of an imported function pointer fails. The mental model: the GOT is a table of function pointers that must be writable during relocation but need not be afterward. Full RELRO closes that window at the cost of slower startup. It is complementary to NX, canaries, and ASLR — none alone is sufficient.

### Method
1. Look for a `GNU_RELRO` program header in `readelf -l`.
2. Distinguish partial (GOT.plt still writable) from full (all resolved eagerly).
3. Check `LD_BIND_NOW` or `-z now` in your build.
4. In GDB, inspect mapping permissions for the GOT page after startup.

### Example
In an authorized sandbox:
```bash
$ readelf -l <LAB>/demo | grep -A1 GNU_RELRO
  GNU_RELRO 0x002df8 0x0000000000003df8 0x0 0x208 0x208 R   0x1
$ readelf -d <LAB>/demo | grep BIND_NOW
  0x000000000000001e (FLAGS) BIND_NOW
```

| Mode | GOT.plt writable | Binding |
| --- | --- | --- |
| none | yes | lazy |
| partial | yes | lazy |
| full | no | eager |

### Common mistakes
Assuming partial RELRO protects the GOT; confusing the relocation table with the GOT; thinking full RELRO removes the need for other mitigations.

### Defense / verification
Enable full RELRO in production builds and verify `BIND_NOW` in `readelf -d`. In assessment notes, state which GOT entries remain writable.

### Knowledge check
**Q:** Which RELRO mode makes the GOT read-only after relocation? **A:** Full RELRO.

===MODULE===
TITLE: CFI, CET, and Honest Exploitability Assessment
LEVEL: Advanced
MINUTES: 50
SUMMARY: Learn modern control-flow protections and how to write a defensible, non-speculative assessment of a bug.
OBJECTIVES: describe shadow stacks and indirect branch tracking | list layered mitigations | write a measured impact statement
TAKEAWAYS: CET adds shadow stack and IBT | CFI narrows valid indirect targets | assessments must state assumptions and evidence
PRACTICE: In an isolated lab, compile a sample with `-fcf-protection=full`, inspect `endbr64` instructions, and draft a one-page exploitability assessment with evidence and limits.
SOURCES: None
---
## Core idea
Control-Flow Integrity (CFI) mechanisms restrict indirect jumps and calls to legitimate targets. Intel CET contributes two features: a **shadow stack** that stores a protected copy of return addresses, and **Indirect Branch Tracking** requiring `endbr64` at valid indirect targets. Together with NX, canaries, ASLR, PIE, and RELRO, they form defense in depth. The mental model: each mitigation removes one easy path; a professional assessment does not claim "exploitable" or "safe" from a single flag, but weighs the bug primitive, available mitigations, and any leak or bypass observed in evidence.

### Method
1. Inventory mitigations with `checksec` or equivalent on your own binary.
2. Identify the bug primitive: what can be read or written, how much, how often.
3. For each mitigation, ask whether the primitive defeats, bypasses, or is stopped by it.
4. State conclusions with evidence addresses and explicit unknowns.
5. Avoid claiming techniques you have not demonstrated in the lab.

### Example
In an authorized sandbox:
```bash
$ checksec --file=<LAB>/demo
RELRO: Full    Stack: Canary found
NX: NX enabled PIE: PIE enabled
$ objdump -d <LAB>/demo | grep -c endbr64
23
```

| Mitigation | Blocks |
| --- | --- |
| canary | stack return overwrite |
| ASLR+PIE | fixed-address reuse |
| CET shadow stack | ROP chains |
| IBT | invalid indirect targets |

### Common mistakes
Equating "mitigations enabled" with "not exploitable"; speculating beyond demonstrated evidence; ignoring data-only attack surfaces.

### Defense / verification
Enable CET/CFI where supported and keep an evidence log per finding. Review assessments with a peer to remove unsupported claims.

### Knowledge check
**Q:** What two features does Intel CET provide? **A:** A shadow stack and indirect branch tracking (`endbr64`).

===MODULE===
TITLE: Malware Analysis Sandbox and Safety
LEVEL: Intermediate
MINUTES: 40
SUMMARY: Establish a contained, authorized environment for behavior analysis before examining any suspicious binary.
OBJECTIVES: design an isolated lab | define authorization boundaries | apply snapshot and containment habits
TAKEAWAYS: never analyze real third-party systems | use disposable, snapshotted guests | network simulation beats live internet
PRACTICE: In an isolated sandbox, build a disposable virtual machine of your own, take a snapshot, and document a rollback procedure before running any sample.
SOURCES: None
---
## Core idea
Behavioral analysis must happen in a contained environment you control, with samples you are authorized to examine (your own test artifacts or explicitly in-scope engagement material). A typical lab is a disposable virtual machine with no shared folders, a host-only or simulated network, and a snapshot you can restore instantly. The mental model: assume the sample will try to escape, persist, or phone home; containment is about limiting blast radius, not trusting the artifact. Never deploy what you learn to real systems. This module sets the safety frame for all malware-analysis modules that follow.

### Method
1. Define scope in writing: which sample, whose permission, what timeframe.
2. Create a VM with no credentials and minimal services.
3. Configure host-only networking or a fake DNS/HTTP sink; avoid live internet.
4. Take a clean snapshot and verify you can restore it.
5. Run only inside the guest, and record every action.

### Example
In an authorized sandbox:
```bash
$ virsh snapshot-create-as <LAB_VM> clean     # lab-only setup
$ virsh snapshot-list <LAB_VM>
 Name   Creation Time
 clean  2026-11-24 09:00:00
```

| Control | Purpose |
| --- | --- |
| snapshot | instant rollback |
| host-only net | no external spread |
| no shared folders | limit escape |
| disposable guest | destroy after run |

### Common mistakes
Analyzing samples on a personal machine; connecting the guest to production networks; skipping snapshot verification.

### Defense / verification
After each session, restore the snapshot and confirm no changes persist. Keep a chain-of-custody log: hashes, times, and tools used.

### Knowledge check
**Q:** Why prefer simulated networking over live internet in a malware lab? **A:** It prevents unintended external communication and spread.

===MODULE===
TITLE: Static Triage of Suspicious Samples
LEVEL: Intermediate
MINUTES: 40
SUMMARY: Extract safe, high-level facts — hashes, type, strings, imports — without executing anything.
OBJECTIVES: compute and record hashes | identify file type and packing | extract strings and imports
TAKEAWAYS: hashing establishes identity | type and imports hint at capability | packing can hide evidence
PRACTICE: In an isolated lab, create a harmless test sample of your own and produce a static triage report with hash, file type, strings, and imports.
SOURCES: None
---
## Core idea
Static triage gathers facts without running the artifact. Start with cryptographic hashes (SHA-256) to establish identity and enable comparison with threat-intelligence sources you are authorized to query. `file` identifies format; `strings` reveals literals; import tables list APIs that suggest capabilities (file access, networking, process injection). Packing or obfuscation can conceal these signals, so low entropy and readable strings are meaningful evidence. The mental model: triage builds a *hypothesis* of what the sample might do, which dynamic analysis later confirms or refutes.

### Method
1. Compute SHA-256 and record file size.
2. Run `file` and compare magic bytes to the claimed extension.
3. Run `strings -n 6` and filter for URLs, paths, registry keys, and commands.
4. List imports (PE/ELF) and note sensitive APIs.
5. Flag packing signs: high entropy, few imports, unusual sections.

### Example
In an authorized sandbox:
```bash
$ sha256sum <LAB>/sample.bin
9f86d081...  <LAB>/sample.bin
$ file <LAB>/sample.bin
PE32+ executable (GUI) x86-64, for MS Windows
$ strings -n 6 <LAB>/sample.bin | grep -iE 'http|\.dll'
CreateFileW
WinHttpOpen
```

| Signal | Interpretation |
| --- | --- |
| SHA-256 | stable identity |
| many imports | richer capability hint |
| high entropy | possible packing |

### Common mistakes
Treating strings as proof of behavior; assuming a benign import list means safe code; sharing samples or hashes outside authorized channels.

### Defense / verification
Record hashes in your lab notes and re-check after any handling step. Use these observations to write YARA rules later, but validate them against known-good files you own.

### Knowledge check
**Q:** What does high entropy in a PE section often suggest? **A:** Packing or encryption of content.

===MODULE===
TITLE: Dynamic Behavior Analysis
LEVEL: Intermediate
MINUTES: 45
SUMMARY: Observe a sample's runtime effects — processes, files, registry, network — inside a contained sandbox.
OBJECTIVES: capture process and API activity | monitor filesystem and registry changes | observe network indicators safely
TAKEAWAYS: dynamic analysis confirms or refutes static hypotheses | baseline-and-diff reveals changes | all runs stay contained
PRACTICE: In an isolated sandbox, run one of your own test binaries while recording process creation and file writes, then diff against a clean baseline snapshot.
SOURCES: None
---
## Core idea
Dynamic analysis watches what a sample actually does: child processes, created or modified files, registry keys, and network connections. The mental model: compare a clean baseline to a post-run state — the difference is the sample's footprint. Tools range from simple snapshots and `strace`/Process Monitor to full sandboxes. Network activity should be observed through a simulated sink so no real third party is contacted. Findings here feed indicators of compromise and detection rules, always under your authorization.

### Method
1. Restore the clean VM snapshot and start monitoring tools.
2. Record a baseline of processes, filesystem, and registry.
3. Launch the sample and let it run for a defined interval.
4. Capture a second state and diff it against the baseline.
5. Note network destinations as indicators, without connecting out.

### Example
In an authorized sandbox:
```bash
$ strace -f -e trace=file,process,network -o <LAB>/trace.log <LAB>/sample
$ grep -E 'openat|connect' <LAB>/trace.log | head -3
openat(AT_FDCWD, "/LAB/config.ini", O_RDONLY) = 3
connect(3, {sa_family=AF_INET, sin_port=htons(80)}, 16) = 0
```

| Artifact | Tool | Finding type |
| --- | --- | --- |
| process tree | ProcMon / ps | child processes |
| file writes | strace / diff | dropped files |
| registry | ProcMon | persistence keys |
| network | simulated sink | C2 indicators |

### Common mistakes
Running without a clean baseline; allowing real outbound traffic; treating sandbox artifacts as definitive proof of intent.

### Defense / verification
Restore the snapshot after each run and confirm repeatability with a second execution. Correlate dynamic findings with the static strings and imports you recorded earlier.

### Knowledge check
**Q:** Why baseline-and-diff is used in dynamic analysis? **A:** To isolate changes caused by the sample from pre-existing system state.

===MODULE===
TITLE: Persistence Mechanisms and Indicators
LEVEL: Intermediate
MINUTES: 40
SUMMARY: Recognize common ways software survives reboot and turn those behaviors into verifiable indicators.
OBJECTIVES: list common persistence locations | link behavior to indicators | verify findings in your own sandbox
TAKEAWAYS: persistence implies autostart configuration | registry, services, scheduled tasks, and cron are common | indicators must be testable
PRACTICE: In an isolated lab, create a harmless autostart entry for your own test binary, observe it after a reboot of the disposable VM, and document the indicator.
SOURCES: None
---
## Core idea
Persistence is any configuration that causes code to run automatically — after login, reboot, or a scheduled trigger. Common Windows locations include Run keys, services, scheduled tasks, and startup folders; Linux equivalents include systemd units, cron, and shell profiles. The mental model: persistence is a *state change*, so it is visible as an indicator: a new registry value, a service binary path, a scheduled task XML, or a cron line. Recognizing these helps defenders hunt for unauthorized changes. We only create such entries for our own test binaries in a disposable VM.

### Method
1. Take a baseline of autostart locations in the clean guest.
2. Run the sample and capture changes to those locations.
3. Record exact keys, paths, commands, and hashes of referenced files.
4. Reboot the guest and confirm whether the entry executes.
5. Translate each confirmed change into a testable indicator.

### Example
In an authorized sandbox:
```text
HKCU\Software\Microsoft\Windows\CurrentVersion\Run
  Value: LABUpdate    Data: C:\LAB\tester.exe
Task: \LABTask   Trigger: ONLOGON   Action: C:\LAB\tester.exe
```

| Mechanism | Indicator |
| --- | --- |
| Run key | new value with binary path |
| Service | service with suspicious ImagePath |
| Cron | new crontab line |
| systemd | new unit in user config |

### Common mistakes
Listing every autostart entry as malicious; ignoring legitimate software changes; skipping verification after reboot.

### Defense / verification
Restore the snapshot and verify indicators do not appear in a clean run. In production, monitor authorized autostart locations with change auditing and alert only on deviations from a documented baseline.

### Knowledge check
**Q:** What makes a persistence finding an actionable indicator? **A:** A precise, testable artifact such as a key, path, or command that can be checked on other systems.

===MODULE===
TITLE: Writing YARA Rules from Observations
LEVEL: Beginner
MINUTES: 40
SUMMARY: Turn confirmed strings and byte patterns into YARA rules and validate them against known-good files.
OBJECTIVES: write a basic YARA rule | use strings and conditions | test for false positives
TAKEAWAYS: YARA matches patterns in files or memory | combine multiple conditions for specificity | always test against benign corpora
PRACTICE: In an isolated lab, write a YARA rule describing your own test sample and verify it matches that sample but not three unrelated benign files.
SOURCES: None
---
## Core idea
YARA is a pattern-matching language for describing malware families — or, in our case, artifacts you create in a lab. A rule has a name, optional tags and metadata, a `strings` section (`text`, `hex`, `regex`), and a `condition` that combines matches. The mental model: each string is a clue; the condition states how many clues must co-occur. Good rules balance specificity (few false positives) with coverage (catch variants). Derived indicators should come from validated observations, not guesses, and rules must be tested against a benign corpus before use.

### Method
1. Select unique, stable strings from confirmed analysis.
2. Add anchored hex patterns for structural context.
3. Write a condition requiring multiple independent matches.
4. Run against your sample and a benign corpus.
5. Refine strings that cause false positives.

### Example
In an authorized sandbox:
```yara
rule LAB_Tester_Indicator {
  meta:
    description = "Lab test artifact only"
  strings:
    $a = "LABUpdate" ascii
    $b = "C:\\LAB\\tester.exe" ascii
    $c = { 55 48 89 e5 48 83 ec 20 }
  condition:
    all of ($a, $b) and $c
}
```
Validation:
```bash
$ yara <LAB>/rule.yar <LAB>/sample.bin
LAB_Tester_Indicator <LAB>/sample.bin
```

| Component | Purpose |
| --- | --- |
| strings | clues to match |
| condition | logic combining clues |
| meta | documentation |

### Common mistakes
Using generic strings that match everything; requiring only one weak indicator; deploying rules without a benign-corpus test.

### Defense / verification
Run every rule against your known-good files and document false positives. Version rules with metadata so their origin and evidence remain traceable.

### Knowledge check
**Q:** Why test a YARA rule against benign files? **A:** To detect false positives before operational use.

===MODULE===
TITLE: Memory Forensics Fundamentals
LEVEL: Intermediate
MINUTES: 45
SUMMARY: Learn what can be recovered from a RAM image and how Volatility-style plugins expose processes and artifacts.
OBJECTIVES: acquire a lab memory image | list processes and connections | connect memory findings to disk triage
TAKEAWAYS: memory captures running state | plugins reconstruct structures from raw bytes | analysis stays within authorized scope
PRACTICE: In an isolated lab, capture a memory image of your own disposable VM while a test binary runs, then list processes and network sockets from the image.
SOURCES: None
---
## Core idea
Memory forensics examines a snapshot of RAM to recover running processes, loaded modules, network sockets, and in-memory strings that may never touch disk. Tools such as Volatility use OS-specific profiles or symbol tables to interpret raw structures. The mental model: a memory image is a frozen city; plugins map raw bytes back to objects like processes and sockets. Because RAM is volatile and easily contaminated, acquisition order and documentation matter. All captures here come from your own disposable VM — never from a system you are not authorized to image.

### Method
1. Acquire a memory image from the running lab guest with a trusted tool.
2. Identify the correct profile/OS information.
3. List processes with `pslist`/`psscan` and note anomalies.
4. Check network connections and loaded DLLs.
5. Correlate findings with the sample's static and dynamic indicators.

### Example
In an authorized sandbox:
```bash
$ vol -f <LAB>/mem.raw windows.pslist | head -8
PID   PPID  ImageFileName   Offset
412   4     System          0x85c3d188
980   412   LABtester.exe   0x86a2f3c8
$ vol -f <LAB>/mem.raw windows.netscan | grep ESTABLISHED
```

| Plugin | Reveals |
| --- | --- |
| `pslist` | active processes |
| `psscan` | hidden/unlinked processes |
| `netscan` | sockets and connections |
| `dlllist` | loaded modules |

### Common mistakes
Using the wrong profile; treating every unknown process as malicious; forgetting acquisition changes the state being captured.

### Defense / verification
Acquire a clean baseline image for comparison and document hashes of both images. Correlate any suspicious process with file-system and registry evidence before concluding.

### Knowledge check
**Q:** Why use `psscan` in addition to `pslist`? **A:** It can find unlinked or hidden processes not visible in the active list.

===MODULE===
TITLE: Fuzzing Concepts and Coverage
LEVEL: Intermediate
MINUTES: 40
SUMMARY: Understand how coverage-guided fuzzing explores a program and why seeds and instrumentation matter.
OBJECTIVES: define a fuzzer and coverage | explain seed selection | describe the feedback loop
TAKEAWAYS: fuzzers mutate inputs automatically | coverage tells the fuzzer what is new | good seeds accelerate discovery
PRACTICE: In an isolated lab, write a tiny parser of your own, create five diverse seed inputs, and manually trace which branches each seed reaches.
SOURCES: None
---
## Core idea
Fuzzing runs a program with many generated inputs and watches for crashes, hangs, or assertion failures. **Coverage-guided** fuzzing instruments the target so the fuzzer learns which inputs reach new code, then mutates promising ones. The mental model: a search loop — seed corpus, mutate, run, measure coverage, keep interesting inputs. Seeds that exercise diverse early branches are far more valuable than random bytes. Fuzzing finds bugs in code you own and can instrument; it is not a way to attack third parties. Crashes are leads requiring triage, not proof of a vulnerability.

### Method
1. Choose a narrow, instrumented target with a simple input interface.
2. Build a seed corpus covering each documented input class.
3. Run the fuzzer for a fixed time budget.
4. Inspect the queue for inputs that increased coverage.
5. Triage any saved crash inputs.

### Example
In an authorized sandbox:
```bash
$ mkdir -p <LAB>/seeds && printf 'A\n' > <LAB>/seeds/a
$ timeout 60 afl-fuzz -i <LAB>/seeds -o <LAB>/out -- <LAB>/parser @@
unique_crashes : 2
edges_found    : 318
```

| Term | Meaning |
| --- | --- |
| seed | starting input |
| coverage | which edges executed |
| crash | saved failing input |

### Common mistakes
Using a single trivial seed; fuzzing without instrumentation; treating every crash as exploitable.

### Defense / verification
Keep the seed corpus and coverage logs with your results. Re-run saved crashes against a clean build to confirm reproducibility before deeper analysis.

### Knowledge check
**Q:** What does coverage feedback tell a fuzzer? **A:** Which inputs reach previously unexecuted code, guiding mutation.

===MODULE===
TITLE: AFL++ in Practice
LEVEL: Advanced
MINUTES: 50
SUMMARY: Run AFL++ against a self-written instrumented target and interpret its status screen and crash artifacts.
OBJECTIVES: build an instrumented target | run AFL++ with a seed corpus | interpret key statistics and artifacts
TAKEAWAYS: instrumentation is required for coverage feedback | the status screen shows speed, coverage, and crashes | saved inputs are triage starting points
PRACTICE: In an isolated lab, compile your own small parser with `afl-clang-fast`, fuzz it for two minutes, and document the saved crash file and its reproducer command.
SOURCES: None
---
## Core idea
AFL++ is a coverage-guided fuzzer that instruments the target at compile time (or via QEMU mode) and evolves a corpus of inputs. Its status screen reports execution speed, total paths, edge coverage, and unique crashes. Inputs are delivered through a file (`@@`) or stdin. The mental model: AFL++ maintains a queue of inputs that each unlock new edges; mutations include bit flips, splices, and dictionary tokens. Everything here targets a binary you compiled yourself in an isolated lab.

### Method
1. Compile with `afl-clang-fast -g -O1`.
2. Create a seed directory with at least three diverse inputs.
3. Run `afl-fuzz -i seeds -o out -- target @@`.
4. Read `out/default/fuzzer_stats` for a stable summary.
5. Copy a crash input and reproduce it outside the fuzzer.

### Example
In an authorized sandbox:
```bash
$ afl-clang-fast -g -O1 -o <LAB>/parser <LAB>/parser.c
$ afl-fuzz -i <LAB>/seeds -o <LAB>/out -- <LAB>/parser @@
$ grep -E 'unique_crashes|edges_found' <LAB>/out/default/fuzzer_stats
unique_crashes  : 3
edges_found     : 412
```

| Statistic | Meaning |
| --- | --- |
| execs/sec | throughput |
| paths total | corpus size |
| unique_crashes | distinct faults |

### Common mistakes
Fuzzing an uninstrumented binary; using huge seeds that slow execution; ignoring hangs until the timeout is clear.

### Defense / verification
Reproduce each crash with the exact command line and record the input hash. Integrate the target into your own regression suite once a root cause is fixed.

### Knowledge check
**Q:** What does the `@@` token mean in an AFL++ command? **A:** The placeholder where the generated input file path is substituted.

===MODULE===
TITLE: libFuzzer in Practice
LEVEL: Advanced
MINUTES: 50
SUMMARY: Write a libFuzzer harness for your own library code and use its minimizer and corpus controls.
OBJECTIVES: write an LLVMFuzzerTestOneInput harness | compile with `-fsanitize=fuzzer` | minimize a crashing input
TAKEAWAYS: a harness defines the input boundary | libFuzzer evolves an in-memory corpus | `-minimize_crash` shrinks reproducers
PRACTICE: In an isolated lab, write a harness for one function of your own code, fuzz it for a fixed budget, and minimize any crash to the smallest input.
SOURCES: None
---
## Core idea
libFuzzer is an in-process fuzzer from the LLVM project. You provide a harness function, `LLVMFuzzerTestOneInput(const uint8_t *data, size_t size)`, that feeds bytes into the API you want to test. Compile with `-fsanitize=fuzzer` (optionally address/undefined sanitizers) and supply a corpus directory. The mental model: the fuzzer calls your harness repeatedly in one process, using coverage to guide mutation and automatically minimizing failing inputs. This is ideal for testing your own parsing and decoding code.

### Method
1. Write a harness that resets all global state between calls.
2. Compile with `-fsanitize=fuzzer,address -g -O1`.
3. Seed the corpus with representative inputs.
4. Run with `-max_total_time=120` and inspect new coverage units.
5. Minimize a failing input with `-minimize_crash=1` before any deeper diagnosis.

### Example
In an authorized sandbox:
```c
#include <stdint.h>
#include <stddef.h>
int LLVMFuzzerTestOneInput(const uint8_t *d, size_t n) {
  if (n < 4) return 0;
  parse_my_format(d, n);   /* your own function */
  return 0;
}
```
```bash
$ clang -fsanitize=fuzzer,address -g -O1 harness.c -o <LAB>/fz
$ <LAB>/fz -max_total_time=120 <LAB>/corpus
```

| Flag | Effect |
| --- | --- |
| `-max_total_time` | time budget |
| `-minimize_crash` | shrink input |
| `-artifact_prefix` | crash output path |

### Common mistakes
Leaking state between harness calls; ignoring early-return guards that block coverage; fuzzing code you do not own or are not authorized to test.

### Defense / verification
Reproduce minimized crashes with a standalone program and add them to unit tests after a fix. Keep the grown corpus as a regression asset so future changes are checked against the same inputs that once failed.

### Knowledge check
**Q:** What function must a libFuzzer harness define? **A:** `LLVMFuzzerTestOneInput`.

===MODULE===
TITLE: Sanitizers: ASan, UBSan, and MSan
LEVEL: Advanced
MINUTES: 45
SUMMARY: Use compiler sanitizers to detect memory and undefined-behavior bugs early in your own code.
OBJECTIVES: build with AddressSanitizer | interpret a report | distinguish UBSan and MSan roles
TAKEAWAYS: ASan detects out-of-bounds and UAF with redzones | UBSan flags undefined operations | MSan tracks uninitialized values
PRACTICE: In an isolated lab, compile your own program with `-fsanitize=address` and reproduce a lab bug, then capture and annotate the ASan report.
SOURCES: None
---
## Core idea
Sanitizers add runtime checks around ordinary operations. AddressSanitizer (ASan) uses shadow memory and redzones to catch out-of-bounds access, use-after-free, and double-free. UndefinedBehaviorSanitizer (UBSan) traps issues like signed overflow, misaligned access, and invalid shifts. MemorySanitizer (MSan) detects use of uninitialized values but generally requires an instrumented libc. The mental model: sanitizers turn latent, silent corruption into an immediate, located error — ideal during development and fuzzing of code you own.

### Method
1. Rebuild the target with `-fsanitize=address -g -O1 -fno-omit-frame-pointer`.
2. Run the known lab input and read the first report line.
3. Identify the fault type and the allocation/free stack traces.
4. Add UBSan (`-fsanitize=undefined`) for arithmetic and alignment bugs.
5. Fix the code and confirm the report disappears.

### Example
In an authorized sandbox:
```bash
$ clang -fsanitize=address -g -O1 <LAB>/bug.c -o <LAB>/bug_asan
$ <LAB>/bug_asan <LAB>/input
==1234==ERROR: AddressSanitizer: heap-buffer-overflow on address 0x60200000001c
WRITE of size 1 at 0x60200000001c thread T0
    #0 0x401234 in main <LAB>/bug.c:7
```

| Sanitizer | Detects |
| --- | --- |
| ASan | OOB, UAF, double free |
| UBSan | UB arithmetic, alignment |
| MSan | uninitialized reads |

### Common mistakes
Using optimized builds without `-g`, making traces hard to read; assuming ASan replaces correct bounds checks; mixing incompatible sanitizers.

### Defense / verification
Add sanitizer builds to your own CI and require a clean run. Verify fixes by re-running the exact crashing input.

### Knowledge check
**Q:** Which sanitizer detects use-after-free? **A:** AddressSanitizer (ASan).

===MODULE===
TITLE: Crash Triage and Input Minimization
LEVEL: Advanced
MINUTES: 45
SUMMARY: Turn a raw crash into a small, reproducible artifact and a classified fault before deeper root-cause work.
OBJECTIVES: reproduce a crash reliably | minimize the input | classify the fault type
TAKEAWAYS: reproducibility comes first | minimization shrinks debugging effort | classification guides mitigation
PRACTICE: In an isolated lab, take a fuzzer-produced crashing input for your own binary, minimize it by hand while preserving the crash, and record the final bytes.
SOURCES: None
---
## Core idea
A crash artifact is a starting point, not a conclusion. Triage asks three questions: does it reproduce, what minimal input still triggers it, and what class of fault is it? Minimization removes bytes that do not affect the failure, making stack traces and patches easier to reason about. Classification — out-of-bounds read, write, null dereference, assertion, hang — determines severity and the right fix. The mental model: reduce the problem until the remaining input is a precise experiment. All of this applies to binaries and code you own in an isolated lab.

### Method
1. Re-run the exact command to confirm reproducibility.
2. Capture the crash type, faulting address, and stack trace.
3. Remove or zero chunks of input, re-running after each change.
4. Stop when no further byte can be removed without losing the crash.
5. Classify and record the result.

### Example
In an authorized sandbox:
```bash
$ <LAB>/parser <LAB>/crash-0x9a2f   # reproduces
Segmentation fault (core dumped)
$ xxd -g1 <LAB>/crash-0x9a2f
00000000: 41 41 41 41 00 02 ff 41 41 41
```

| Stage | Output |
| --- | --- |
| reproduce | yes/no |
| minimize | byte count |
| classify | OOB write / read / hang |

### Common mistakes
Skipping reproduction; over-minimizing into a different bug; ignoring non-crash failures like excessive runtime.

### Defense / verification
Keep both the original and minimized inputs, with hashes. Verify the patch against both to ensure the fix covers the general case.

### Knowledge check
**Q:** Why minimize a crashing input? **A:** It isolates the bytes necessary to trigger the bug, simplifying diagnosis.

===MODULE===
TITLE: Root Cause Analysis
LEVEL: Advanced
MINUTES: 50
SUMMARY: Trace a crash back to the specific flawed assumption in your own code and propose a verified fix.
OBJECTIVES: follow data from input to fault | identify the incorrect invariant | implement and verify a fix
TAKEAWAYS: the crash site is often not the bug site | invariants reveal the true cause | verification requires re-running the reproducer
PRACTICE: In an isolated lab, take one minimized crash from your own program, trace the tainted value to its origin, patch the flawed check, and prove the reproducer no longer fails.
SOURCES: None
---
## Core idea
Root cause analysis connects the fault back to the line where a wrong assumption entered the program. A common pattern: a length field from input is trusted, an allocation uses a different length, and the crash appears later during a copy. The mental model: follow the *data*, not just the stack — ask where the bad value was computed and why no check caught it. This is the heart of reverse engineering for defense: turning a symptom into a fix that eliminates a class of bugs.

### Method
1. Start at the faulting instruction and identify which value is invalid.
2. Trace that value backwards through registers, locals, and function arguments.
3. Find the first point where it became inconsistent with reality.
4. State the violated invariant in one sentence.
5. Change the code to enforce the invariant, then re-run all reproducers.

### Example
In GDB on your own code:
```bash
(gdb) bt
#0 memcpy at 0x7fff... 
#1 parse at <LAB>/p.c:24      # copies n bytes into 16-byte buf
(gdb) p n
$1 = 4096
(gdb) p sizeof(buf)
$2 = 16
```
Root cause: `n` comes from input and is never bounded by the destination size.

| Question | Answer target |
| --- | --- |
| What failed? | copy at line 24 |
| Why? | n exceeded destination |
| Where did n originate? | input header |
| Fix | validate n <= sizeof(buf) |

### Common mistakes
Patching only the crash site (e.g., clamping at the copy); ignoring other callers of the same function; failing to re-test variants.

### Defense / verification
Add a regression test with the minimized input and audit sibling code paths for the same invariant. Document the reasoning so the fix survives future changes.

### Knowledge check
**Q:** Why might the crash site differ from the root cause? **A:** The invalid value can be created earlier and only cause a fault when used later.

===MODULE===
TITLE: Capstone: Full Reverse-Engineering Workflow
LEVEL: Advanced
MINUTES: 60
SUMMARY: Combine triage, disassembly, decompilation, debugging, and fuzzing into one end-to-end authorized investigation.
OBJECTIVES: plan an investigation | apply each technique in sequence | produce an evidence-backed report
TAKEAWAYS: start broad, then narrow to a hypothesis | cross-check static and dynamic evidence | reports separate facts from inference
PRACTICE: In an isolated lab, analyze one self-authored binary end to end: triage, disassemble the key function, debug it, fuzz it, fix any bug found, and write a short report.
SOURCES: None
---
## Core idea
Real investigations combine every skill in this curriculum. A disciplined workflow: scope and safety check; static triage (hashes, type, strings, imports); format and loader analysis; disassembly and decompilation to form hypotheses; dynamic confirmation in a debugger; fuzzing and sanitizers to find edge cases; root-cause analysis and fix; and a report that clearly separates observed facts from inference. The mental model: a funnel — broad observation narrows to confirmed findings, each backed by an address, a command, or a reproducible input.

### Method
1. Write the scope and authorization statement first.
2. Triage: record hash, format, imports, strings.
3. Map: sections, segments, mitigations (`checksec`).
4. Reverse: identify main, interesting calls, and data references.
5. Confirm: breakpoints and watchpoints on your own binary.
6. Stress: fuzz with sanitizers for a bounded time budget.
7. Fix and verify; then write the report.

### Example
In an authorized sandbox:
```text
FINDING: unchecked copy in parse() at offset 0x1139
Evidence: disassembly call memcpy@plt; ASan heap-buffer-overflow
Reproducer: <LAB>/min-input (sha256 3f9a...)
Mitigation: validate length; rebuild with ASan + canary + PIE
Status: fixed, regression test added
```

| Phase | Deliverable |
| --- | --- |
| triage | hash, type, imports |
| reverse | annotated functions |
| dynamic | trace log |
| stress | minimized crash |

### Common mistakes
Jumping to conclusions from one tool; losing the chain of evidence; mixing lab artifacts with findings.

### Defense / verification
Re-run the complete workflow on a second, unrelated self-authored binary to prove the process generalizes. Peer-review the report for unsupported claims.

### Knowledge check
**Q:** What should a report separate explicitly? **A:** Observed facts (with addresses/commands) from inference or hypothesis.

===MODULE===
TITLE: Mastery Checklist and Continuing Practice
LEVEL: Advanced
MINUTES: 30
SUMMARY: Consolidate the full curriculum into a self-assessment checklist and a plan for deliberate, authorized practice.
OBJECTIVES: audit coverage across all 50 modules | identify weak areas | schedule recurring lab practice
TAKEAWAYS: mastery is demonstrated by explanation and reproduction | keep a lab notebook with commands and evidence | continue with real, authorized projects
PRACTICE: In an isolated lab, pick one weak module, re-do its exercise from memory, and write a 200-word explanation plus the commands you used, then review it a week later.
SOURCES: None
---
## Core idea
You have completed a zero-to-expert path: number systems, architecture, formats, disassembly, debugging, memory-corruption classes, mitigations, malware behavior analysis, fuzzing, sanitizers, triage, and root cause. Mastery is not having read these topics but being able to reproduce the result and explain *why*. The mental model: maintain a lab notebook that is your own searchable corpus — commands, outputs, offsets, and conclusions — and revisit it on a schedule. Every skill here should be applied only to binaries you own, synthetic labs, or engagements with explicit written authorization.

### Checklist
- [ ] Convert, sign-extend, and decode endian values without tools, then verify with tools.
- [ ] Read a function's prologue, arguments, and branches from raw disassembly.
- [ ] Explain ELF/PE/Mach-O layout, loader, imports, and relocations.
- [ ] Use Ghidra and r2 to identify and annotate functions.
- [ ] Debug with breakpoints and watchpoints; confirm hypotheses dynamically.
- [ ] Demonstrate corruption classes in own labs: stack, format string, UAF, heap.
- [ ] Inventory mitigations: NX, canary, ASLR, PIE, RELRO, CFI/CET.
- [ ] Analyze a sample safely in a contained sandbox; produce YARA and indicators.
- [ ] Fuzz with AFL++/libFuzzer, triage and minimize crashes, find root cause.
- [ ] Write evidence-backed reports and separate fact from inference.

| Practice cadence | Activity |
| --- | --- |
| weekly | one annotated disassembly |
| monthly | one end-to-end capstone |
| quarterly | review notebook for gaps |

### Common mistakes
Collecting tools without keeping notes; practicing only familiar scenarios; practicing outside authorized scope.

### Defense / verification
Teach one concept to a peer using only your notebook, then verify your explanation against the relevant module. Repeat until explanations are accurate without notes.

### Knowledge check
**Q:** What is the best evidence that you have mastered a module? **A:** You can reproduce its lab result and explain the reasoning without looking it up.
