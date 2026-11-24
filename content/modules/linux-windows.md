===MODULE===
TITLE: Bits, Bytes, and Number Bases
LEVEL: Beginner
MINUTES: 25
SUMMARY: Build the mental model of binary, hexadecimal, and byte ordering that every later security concept rests on.
OBJECTIVES: Convert between binary, decimal, and hex | Explain bytes, words, and address units | Read a hex dump of a file
TAKEAWAYS: Computers store information as bits grouped into bytes | Hex is compact notation for binary | Addresses and masks are just numbers in a chosen base
PRACTICE: In your own VM, create a file with known bytes and inspect it with xxd/Format-Hex, then decode each byte by hand.
SOURCES: None
---
## Core idea
Every value a computer touches is ultimately a pattern of bits. A bit is one of two states, 0 or 1; eight bits form a byte, which can hold 256 distinct values (0–255). Because binary strings are long, we group four bits into one hexadecimal (base-16) digit, so a byte is exactly two hex digits. Security work constantly uses hex: file signatures, hashes, MAC addresses, subnet masks, and packet bytes are all written in hex. The central mental model is that the base is only notation — the underlying quantity never changes. Once you internalize that, reading a hex dump or a permission mask becomes mechanical rather than mysterious.

## Method
1. Decide the unit being discussed: bit (b) or byte (B), and watch the case.
2. Convert binary to hex by splitting into groups of four bits from the right.
3. Convert hex to decimal by multiplying each digit by 16^n and summing.
4. Read a hex dump: the left column is the byte offset, the middle columns are the bytes, the right column shows printable ASCII.
5. When a field spans several bytes, consult the format spec for its byte order (endianness).

## Example (lab only)
```bash
printf 'A\x7f\x00\xff' > <LAB_FILE>
xxd <LAB_FILE>
python3 -c 'print(hex(0b01000001))'
```
On your own Windows VM, `Format-Hex <LAB_FILE>` shows the same bytes.

| Base | Digits | One byte |
|------|--------|----------|
| Binary | 0-1 | 01000001 |
| Decimal | 0-9 | 65 |
| Hex | 0-F | 41 |

## Common mistakes
Confusing Mbit with MB (1 MB = 8 Mbit). Assuming every multi-byte field is little-endian. Forgetting that a printable character is just a byte with a particular value, not a different kind of data.

## Defense / verification
Cross-check conversions in two independent tools (`xxd` and Python) before trusting a byte offset in a report. Record the exact hex of evidence files so later changes are detectable.

## Knowledge check
**Q:** What is 0x41 in decimal, and how many bits is it?
**A:** 65, and eight bits (one byte): 4×16 + 1 = 65.

===MODULE===
TITLE: CPU Registers and the Instruction Cycle
LEVEL: Beginner
MINUTES: 30
SUMMARY: Understand the fetch-decode-execute loop and the register set, the foundation for reasoning about program state and exploits.
OBJECTIVES: Trace the fetch-decode-execute cycle | Name the roles of PC, SP, and flags | Inspect registers in a debugger
TAKEAWAYS: The CPU is a state machine driven by registers | The program counter points to the next instruction | Flags gate conditional branches
PRACTICE: In a disposable Linux VM, load a tiny binary in gdb and step through three instructions while printing registers.
SOURCES: None
---
## Core idea
A CPU repeats one loop: fetch an instruction from the address in the program counter (PC), decode it, execute it, then advance the PC. Registers are small, fast storage inside the processor that hold this working state. General-purpose registers hold operands; the stack pointer (SP) tracks the top of the call stack; the flags register records outcomes such as zero or carry from the last operation. Conditional jumps read those flags, so control flow is a direct function of arithmetic state. The mental model: a program is data plus a register state machine, and every instruction deterministically transforms that state. Debuggers expose exactly this view.

## Method
1. Identify the architecture and its register width (32-bit vs 64-bit).
2. Note the PC (called RIP on x86-64) and the current instruction it points to.
3. Examine SP (RSP) to find the active stack frame.
4. Read the flags (RFLAGS) to understand why a branch was taken.
5. Single-step and observe which registers change.

## Example (lab only)
```bash
gdb -q <LAB_BINARY>
(gdb) start
(gdb) info registers rip rsp rflags
(gdb) stepi
```
On Windows, `wtfdbg` or WinDbg `r` prints registers (`rip`, `rsp`, `eflags`).

| Register | Role |
|----------|------|
| RIP / PC | Address of next instruction |
| RSP / SP | Top of stack |
| RFLAGS | Condition and status bits |

## Common mistakes
Assuming root or Administrator implies kernel execution — it does not. Confusing a register's name with its size (`eax` is the low 32 bits of `rax`). Ignoring flags when a branch behaves unexpectedly.

## Defense / verification
Verify and document register state when analyzing a crash in your own binary. Understand that defenses such as stack canaries and non-executable stacks are built on these hardware details.

## Knowledge check
**Q:** Which register holds the address of the next instruction, and which holds the stack top?
**A:** RIP/PC holds the next instruction address; RSP/SP holds the stack top.

===MODULE===
TITLE: CPU Privilege Rings and Mode Transitions
LEVEL: Intermediate
MINUTES: 35
SUMMARY: Learn how hardware privilege levels separate user code from the kernel and how system calls cross that boundary safely.
OBJECTIVES: Explain ring 0 versus ring 3 | Trace a system call transition | Distinguish root from kernel mode
TAKEAWAYS: Rings are hardware-enforced privilege levels | System calls are the controlled gateway to kernel services | Being root does not mean running in ring 0
PRACTICE: On your own Linux VM, use strace to capture the syscalls made by a simple command and identify the transition points.
SOURCES: None
---
## Core idea
Modern CPUs define privilege levels called rings. Ring 0 is the kernel: it can execute any instruction and touch any memory. Ring 3 is user mode: privileged instructions and kernel memory are forbidden. This boundary is enforced by hardware, not by software convention. User programs request kernel services through a controlled mechanism — the `syscall`/`sysenter` instruction on x86-64, or `svc` on ARM — which atomically switches to ring 0 at a vetted entry point. The mental model: user code is a guest that must ask a trusted supervisor through a single, audited doorway. Even the root account runs in ring 3; root is an operating-system authorization concept, not a CPU mode. Confusing these two is a classic error.

## Method
1. Classify each component as user space (ring 3) or kernel space (ring 0).
2. List the services a program needs from the kernel (files, network, time).
3. Trace the program and identify each system call and its arguments.
4. Observe the return value and error code (`errno` / `GetLastError`).
5. Note where the kernel validates arguments before acting.

## Example (lab only)
```bash
strace -f -e trace=openat,read,write <LAB_CMD> 2> <LAB_TRACE>
grep openat <LAB_TRACE>
```
On Windows, Sysinternals `Procmon` shows equivalent `NtCreateFile` calls.

| Concept | Ring 3 | Ring 0 |
|---------|--------|--------|
| Who runs here | Applications | Kernel, drivers |
| Privileged instructions | Blocked | Allowed |
| Memory access | Own address space | All physical memory |

## Common mistakes
Believing a root-owned process runs in ring 0. Assuming syscall arguments are trusted — the kernel must copy and validate them. Forgetting that a driver bug runs in ring 0 and can compromise the whole machine.

## Defense / verification
Prefer minimal kernel attack surface: fewer drivers, verified signatures. Verify syscall behavior with `strace` and confirm your process's mode cannot be elevated by user code alone.

## Knowledge check
**Q:** Does the root user execute in ring 0? Why or why not?
**A:** No. Root is a user-space identity; the CPU mode remains ring 3 until a system call switches it.

===MODULE===
TITLE: Memory Addresses, Endianness, and Layout
LEVEL: Beginner
MINUTES: 30
SUMMARY: Map out a process's address space and understand endianness so byte-level observations are interpreted correctly.
OBJECTIVES: Describe the classic process memory layout | Explain little- versus big-endian | Interpret an address and an offset
TAKEAWAYS: Addresses identify locations in a virtual address space | Multi-byte values have a defined byte order | Text, data, heap, and stack occupy distinct regions
PRACTICE: In your own VM, print a few integers packed in both byte orders and compare the resulting hex bytes.
SOURCES: None
---
## Core idea
A process sees a contiguous range of virtual addresses, conventionally drawn with the stack at the high end and the program image at the low end. The read-only text segment holds code; the data segment holds initialized globals; the heap grows as memory is allocated; the stack grows downward as functions are called. Endianness defines how a multi-byte value is stored: little-endian puts the least significant byte first (x86 and most Windows/Linux desktops), big-endian puts the most significant byte first (many network protocols, historically called network byte order). The mental model: an address tells you where, endianness tells you how to read the bytes there. Confusing the two produces plausible but wrong conclusions.

## Method
1. State the width of the value you are reading (8, 16, 32, or 64 bits).
2. Determine the endianness of the source (CPU, file format, or protocol).
3. Identify which memory region an address falls into.
4. Check whether the region should be writable or executable.
5. Translate raw bytes into the intended numeric value.

## Example (lab only)
```bash
python3 -c 'import struct; print(struct.pack("<I", 0x41424344).hex())'
python3 -c 'import struct; print(struct.pack(">I", 0x41424344).hex())'
```
Expected: `44434241` (little) versus `41424344` (big).

| Region | Typical permissions |
|--------|---------------------|
| Text | Read + execute |
| Data | Read + write |
| Heap | Read + write |
| Stack | Read + write |

## Common mistakes
Reading a little-endian value as big-endian and getting a reversed result. Assuming the stack always grows downward on every architecture. Treating an address as the value stored at that address.

## Defense / verification
Use `xxd` plus a known constant to confirm byte order before parsing binaries. Verify region permissions with `/proc/<LAB_PID>/maps` or VMMap on Windows.

## Knowledge check
**Q:** A little-endian 32-bit value 0x41424344 is stored as which byte sequence?
**A:** `44 42 41 43` — least significant byte first.

===MODULE===
TITLE: Processes and the Process Image
LEVEL: Beginner
MINUTES: 25
SUMMARY: Define what a process actually is and learn to inspect its identity, state, and memory image on Linux and Windows.
OBJECTIVES: Define a process and its components | Read process metadata from the OS | Distinguish processes from threads
TAKEAWAYS: A process is an address space plus register and kernel state | The PID is the kernel's handle for it | Threads share an address space
PRACTICE: In your own VM, list all processes and inspect one process's directory under /proc, noting its key files.
SOURCES: None
---
## Core idea
A process is the OS's unit of resource ownership: a private virtual address space, a set of register values, open file descriptors, security credentials, and kernel bookkeeping. The kernel tracks it by a process ID (PID). Threads are execution contexts inside a process that share the address space and credentials but have their own registers and stack. This distinction matters for security because access tokens and credentials are usually process-wide. On Linux, `/proc/<pid>` exposes a live textual view of this state; on Windows, Task Manager and Sysinternals Process Explorer provide the equivalent. The mental model: a process is a container of state, and threads are the workers running inside it.

## Method
1. Enumerate processes and note PID, parent PID (PPID), owner, and state.
2. Follow the parent chain to understand process ancestry.
3. Inspect the executable path and command line.
4. List open handles or file descriptors.
5. Identify the security identity (UID or token) the process runs under.

## Example (lab only)
```bash
ps -eo pid,ppid,user,stat,cmd | head -20
ls /proc/<LAB_PID>
cat /proc/<LAB_PID>/status | grep -E 'Name|Uid|Gid|State'
```
On Windows: `Get-Process <LAB_NAME> | Format-List Id,Path,StartTime`.

| Attribute | Linux source | Windows source |
|-----------|--------------|----------------|
| PID | `ps`, `/proc` | Task Manager |
| Owner | `Uid` in status | Process token |
| Image | `/proc/pid/exe` | `Path` |

## Common mistakes
Treating a thread as a separate process when reasoning about permissions. Assuming the displayed command line is trustworthy — it can be altered by the process itself. Forgetting the parent chain when tracing how a process was launched.

## Defense / verification
Verify unexpected processes by checking image path, signature, and parent. In your lab, record a baseline process list so deviations are visible.

## Knowledge check
**Q:** Do two threads of one process share credentials and address space?
**A:** Yes. They share the address space and token/credentials; only registers and stacks differ.

===MODULE===
TITLE: Virtual Memory, Paging, and Protection
LEVEL: Intermediate
MINUTES: 40
SUMMARY: Understand how virtual addresses are translated and how page-level permissions and ASLR form core memory defenses.
OBJECTIVES: Explain virtual-to-physical translation | Interpret /proc/pid/maps | Describe NX, ASLR, and W^X
TAKEAWAYS: The MMU maps virtual pages to physical frames | Each page carries permissions | ASLR and non-executable pages raise exploitation cost
PRACTICE: In your own Linux VM, inspect the memory maps of a running process and identify executable and writable regions.
SOURCES: None
---
## Core idea
Processes never address physical memory directly. The memory management unit (MMU) translates virtual addresses to physical frames using page tables maintained by the kernel, in fixed-size pages (commonly 4 KiB). Each page entry also encodes permissions: read, write, and execute. This is the hardware basis for memory protection. Two defenses build directly on it: address space layout randomization (ASLR) shifts base addresses so guesses fail, and non-executable (NX / DEP) pages prevent data from being run as code. The combined rule W^X — no page is both writable and executable — removes the simplest injection path. The mental model: every memory access is checked by hardware against a permission table, and defenses tune that table.

## Method
1. Identify the virtual address regions of a process.
2. Read the permission string for each region (`r`, `w`, `x`, `p`/`s`).
3. Flag any writable-and-executable region as suspicious.
4. Check whether repeated runs show different base addresses (ASLR).
5. Confirm that code and data live in separate regions.

## Example (lab only)
```bash
cat /proc/self/maps | head -20
grep -E 'rwx' /proc/self/maps
cat /proc/sys/kernel/randomize_va_space
```
On Windows, Process Explorer's "Memory" tab or VMMap shows comparable regions.

| Flag | Meaning |
|------|---------|
| r / w / x | Read / write / execute allowed |
| p / s | Private / shared mapping |

## Common mistakes
Believing virtual addresses equal physical addresses. Assuming ASLR alone stops all memory corruption. Overlooking that JIT compilers legitimately create writable-executable memory.

## Defense / verification
Enable full ASLR (`randomize_va_space=2`), keep DEP/NX on, and audit your own binaries for `rwx` mappings. Verify by running twice and comparing map base addresses.

## Knowledge check
**Q:** What does a `rwxp` mapping indicate, and why is it a concern?
**A:** A private writable-and-executable page; it allows data to be written and then executed, violating W^X.

===MODULE===
TITLE: Linux Filesystem Hierarchy and Inodes
LEVEL: Beginner
MINUTES: 30
SUMMARY: Learn how Linux organizes files, what inodes are, and how directory entries, hard links, and symlinks resolve to data.
OBJECTIVES: Navigate the FHS directory tree | Explain inodes and directory entries | Differentiate hard and soft links
TAKEAWAYS: An inode holds metadata and block pointers, not the filename | Directories map names to inode numbers | Symlinks are files containing a path
PRACTICE: In your own VM, create a file and both kinds of links, then compare inode numbers and observe what happens when the original is removed.
SOURCES: None
---
## Core idea
Linux presents a single tree rooted at `/`, standardized by the Filesystem Hierarchy Standard: `/etc` for configuration, `/var` for variable data and logs, `/home` for users, `/bin` and `/usr/bin` for commands, `/proc` and `/sys` for kernel-generated views. A file's name is not stored in the file; a directory is a table mapping names to inode numbers. The inode holds permissions, ownership, timestamps, size, and pointers to data blocks. A hard link is another directory entry pointing to the same inode; a symbolic link is a distinct file whose contents are a target path. The mental model: names are labels, inodes are the actual objects, and paths are resolved label by label.

## Method
1. Explain each path component as a directory lookup.
2. Use `stat` to reveal inode number, links count, and timestamps.
3. Compare inode numbers to detect hard links.
4. Use `readlink -f` to resolve a symlink chain.
5. Check mount boundaries before creating hard links, since they cannot cross filesystems.

## Example (lab only)
```bash
echo lab > <LAB_FILE>
ln <LAB_FILE> <LAB_HARD>
ln -s <LAB_FILE> <LAB_SOFT>
stat -c '%n inode=%i links=%h' <LAB_FILE> <LAB_HARD>
readlink -f <LAB_SOFT>
```

| Link type | Inode | Survives source deletion |
|-----------|-------|--------------------------|
| Hard | Shared | Yes |
| Symbolic | New | No (dangling) |

## Common mistakes
Assuming renaming a file changes its inode — it does not. Creating symlinks with absolute paths when relative ones are needed for portability. Forgetting that `/proc` entries are generated, not stored on disk.

## Defense / verification
Inspect symlink targets before following them, and verify critical config files have a single expected inode. Use `namei -l <LAB_PATH>` to audit every component's permissions.

## Knowledge check
**Q:** After `rm <LAB_FILE>`, which link still reaches the data?
**A:** The hard link — the inode persists while any directory entry references it; the symlink is now dangling.

===MODULE===
TITLE: Linux Users, Groups, and Identity
LEVEL: Beginner
MINUTES: 30
SUMMARY: Understand UIDs, GIDs, and the identity files that the kernel and user-space tools use for authorization decisions.
OBJECTIVES: Interpret /etc/passwd and /etc/group | Explain real, effective, and saved IDs | Identify the root account
TAKEAWAYS: Identity is numeric: UID and GIDs | Passwords live in /etc/shadow, not /etc/passwd | Effective UID controls most access checks
PRACTICE: In your own VM, create a user and group, then inspect the resulting entries and switch users with su to observe identity changes.
SOURCES: None
---
## Core idea
Linux authorization is built on numbers, not names. Each user has a UID and a primary GID; users may belong to supplementary groups. `/etc/passwd` maps names to UIDs, home directories, and shells; `/etc/group` maps group names to GIDs and members; `/etc/shadow` holds password hashes and aging policy and is readable only by root. A process carries a real UID (who launched it), an effective UID (used for most permission checks), and a saved set-user-ID (allowing temporary switching). The mental model: names are conveniences for humans; the kernel only compares numeric IDs. UID 0 is root and bypasses standard permission checks. Understanding these layers is essential before studying SUID or sudo.

## Method
1. Look up a user with `id` and `getent passwd`.
2. Identify primary versus supplementary groups.
3. Inspect the shadow entry's hash prefix to see the algorithm.
4. Switch users and re-run `id` to confirm real and effective IDs.
5. Confirm that group membership changes require a new login to take effect.

## Example (lab only)
```bash
sudo useradd -m -s /bin/bash <LAB_USER>
sudo usermod -aG <LAB_GROUP> <LAB_USER>
id <LAB_USER>
sudo grep '^<LAB_USER>:' /etc/shadow
su - <LAB_USER> -c 'id'
```

| File | Contains | Readable by |
|------|----------|-------------|
| /etc/passwd | UID, GID, home, shell | Everyone |
| /etc/shadow | Hashes, aging | Root |
| /etc/group | Group membership | Everyone |

## Common mistakes
Editing `/etc/passwd` by hand and breaking formatting. Expecting a new group to apply in an existing shell. Assuming a locked account (`!` or `*` in shadow) can still log in with a password.

## Defense / verification
Use `useradd`/`usermod` rather than manual edits, and audit for UID 0 duplicates with `awk -F: '$3==0' /etc/passwd`. Verify shadow permissions are `000` owned by root.

## Knowledge check
**Q:** Which UID is root, and which file stores the password hash?
**A:** UID 0; the hash is in `/etc/shadow`, readable only by root.

===MODULE===
TITLE: Permission Bits, Ownership, and Access Checks
LEVEL: Beginner
MINUTES: 30
SUMMARY: Master the rwx permission model for files and directories, the three permission classes, and how access decisions are made.
OBJECTIVES: Read a symbolic permission string | Explain rwx differences on files vs directories | Predict an access check outcome
TAKEAWAYS: Three classes (user, group, other) each have r, w, x bits | Directory execute means traverse | The first matching class wins
PRACTICE: In your own VM, create files and directories with varied modes and verify access as two different users.
SOURCES: None
---
## Core idea
Every filesystem object carries three permission classes: owner (u), group (g), and others (o), each with read, write, and execute bits. For a regular file, `r` allows reading contents, `w` allows modification, and `x` allows execution. For a directory, `r` lists names, `w` creates or removes entries, and `x` permits traversal through it to reach children. The kernel evaluates the class that matches the process first — owner, then group, then other — and stops; there is no union of permissions across classes. The mental model: permissions are a small decision tree evaluated top-down, and directories are gates you must pass through to reach anything inside. Missing `x` on a directory makes its contents unreachable even if the files themselves are world-readable.

## Method
1. Read the ten-character mode string: type bit plus three triples.
2. Determine which class the accessing process falls into.
3. Apply the effect of `r`, `w`, and `x` for that object type.
4. Check every directory along the full path for traversal permission.
5. Change modes with `chmod` (symbolic or octal) and ownership with `chown`.

## Example (lab only)
```bash
touch <LAB_FILE>; chmod 640 <LAB_FILE>
mkdir <LAB_DIR>; chmod 750 <LAB_DIR>
ls -ld <LAB_FILE> <LAB_DIR>
namei -l /<LAB_PATH>/<LAB_FILE>
```

| Octal | Symbolic | Meaning |
|-------|----------|---------|
| 7 | rwx | Full |
| 6 | rw- | Read/write |
| 5 | r-x | Read/execute |
| 0 | --- | None |

## Common mistakes
Removing `x` from a directory and wondering why files vanish. Expecting group and other permissions to combine. Granting `w` on a directory without realizing it allows deleting entries regardless of the file's own mode.

## Defense / verification
Audit with `find <LAB_PATH> -perm -0002 -type f` for world-writable files and verify directory traversal with `namei -l`. Prefer least privilege modes.

## Knowledge check
**Q:** A directory is mode 644. Can a user traverse it to open a known filename?
**A:** No — execute (traversal) is missing for all classes, so the path cannot be resolved.

===MODULE===
TITLE: umask and Default Permissions
LEVEL: Beginner
MINUTES: 25
SUMMARY: Learn how the umask shapes newly created file and directory permissions and where it is configured.
OBJECTIVES: Explain how umask masks creation modes | Compute resulting permissions | Set umask persistently
TAKEAWAYS: umask removes bits from a default mode | Files typically start at 666, directories at 777 | A secure default prevents accidental exposure
PRACTICE: In your own VM, change umask, create a file and directory, and confirm the resulting modes match your calculation.
SOURCES: None
---
## Core idea
When a program creates a file, the kernel starts from a base mode — usually 0666 for files and 0777 for directories — and removes the bits set in the process's umask. The umask is therefore a mask of bits to deny, expressed in octal. A umask of 022 yields files at 0644 and directories at 0755, the common default. A stricter umask of 027 yields 0640 and 0750, hiding content from other users. The mental model: creation modes are a request, and umask is a mandatory subtraction applied before the object appears. Because it is inherited by child processes, a single setting at login or service startup shapes everything a session creates. Note that the execute bit is never granted to new files by this mechanism regardless of umask.

## Method
1. Read the current umask with `umask`.
2. Write the base mode in octal (666 for files, 777 for directories).
3. Clear the bits present in the umask to get the effective mode.
4. Create a file and directory and verify with `stat` or `ls -l`.
5. Persist the setting in a shell profile or a systemd unit.

## Example (lab only)
```bash
umask 027
touch <LAB_FILE>; mkdir <LAB_DIR>
stat -c '%a %n' <LAB_FILE> <LAB_DIR>
```
Result: file `640`, directory `750`.

| umask | New file | New directory |
|-------|----------|---------------|
| 022 | 644 | 755 |
| 027 | 640 | 750 |
| 077 | 600 | 700 |

## Common mistakes
Treating umask as an addition rather than a subtraction. Expecting new files to be executable. Forgetting that daemons started by systemd have their own `UMask=` setting, independent of your shell.

## Defense / verification
Set a restrictive umask (`027` or `077`) for privileged sessions and services, then verify with `stat` on newly created artifacts. Audit service units for explicit `UMask=` values.

## Knowledge check
**Q:** With umask 027, what mode does a newly created file get?
**A:** 0640 — 666 with the group write and other bits removed.

===MODULE===
TITLE: SUID, SGID, and the Sticky Bit
LEVEL: Intermediate
MINUTES: 35
SUMMARY: Understand the three special permission bits and how they create controlled privilege elevation or protect shared directories.
OBJECTIVES: Explain SUID, SGID, and sticky semantics | Recognize them in mode strings | Audit and constrain their use
TAKEAWAYS: SUID runs a program with the file owner's UID | SGID sets the effective group or inherits a group on directories | Sticky restricts deletion in shared directories
PRACTICE: In your own VM, audit all SUID/SGID binaries and record a baseline, then test how SGID group inheritance works in a shared directory.
SOURCES: None
---
## Core idea
Beyond rwx, three special bits modify filesystem semantics. The set-user-ID (SUID) bit causes an executed program to run with the effective UID of the file's owner — this is how a normal user can change their own password through a root-owned helper. Set-group-ID (SGID) similarly grants the file's group as effective GID; on a directory, it makes newly created entries inherit that directory's group. The sticky bit, seen on `/tmp`, allows any user to create files but permits only the owner (or root) to delete or rename them. In mode strings these appear as `s` in the execute position or as leading octal digits 4 (SUID), 2 (SGID), and 1 (sticky). The mental model: these are deliberate, auditable exceptions to normal permission rules, and each one should be justified.

## Method
1. List special-bit files with `find` and the `-perm` operator.
2. Note the owner and group of each SUID/SGID executable.
3. Decide whether the privilege is necessary for the program's function.
4. Verify SGID group inheritance by creating a file in a setgid directory.
5. Confirm sticky behavior by trying to remove another user's file in `/tmp`.

## Example (lab only)
```bash
ls -l /usr/bin/passwd
find / -xdev -perm -4000 -type f 2>/dev/null | sort
chmod g+s <LAB_SHARED_DIR>; ls -ld <LAB_SHARED_DIR>
```

| Bit | Octal | Effect |
|-----|-------|--------|
| SUID | 4000 | Run as file owner |
| SGID | 2000 | Effective group / group inheritance |
| Sticky | 1000 | Restrict deletion to owner |

## Common mistakes
Leaving SUID on custom scripts — most kernels ignore SUID for interpreted scripts, which causes confusion. Combining world-writable permissions with SUID, creating an trivial escalation path. Forgetting that copying a file can clear these bits.

## Defense / verification
Maintain a baseline of expected SUID/SGID files and alert on additions. Mount writable areas with `nosuid`, and prefer Linux capabilities over broad SUID where possible.

## Knowledge check
**Q:** Why does `/tmp` use the sticky bit rather than plain 777?
**A:** Because without it, any user could delete or rename another user's files in the shared directory.

===MODULE===
TITLE: Linux Capabilities Instead of Blanket Root
LEVEL: Advanced
MINUTES: 40
SUMMARY: Learn how root's powers are split into fine-grained capabilities and how to grant, bound, and verify them.
OBJECTIVES: Name common capabilities and their scope | Set and inspect file capabilities | Restrict capabilities for services
TAKEAWAYS: Capabilities partition root privileges into named units | CAP_SYS_ADMIN is effectively root-equivalent | Service units can bound and drop capabilities
PRACTICE: In your own VM, copy a harmless network tool, grant it CAP_NET_RAW, and observe the capability sets; then remove it.
SOURCES: None
---
## Core idea
Linux divides the monolithic power of UID 0 into roughly forty independent capabilities, such as `CAP_NET_RAW` (raw sockets), `CAP_NET_BIND_SERVICE` (binding low ports), and `CAP_SYS_ADMIN` (a broad set of administrative operations). Each thread has permitted, effective, inheritable, bounding, and ambient capability sets. The kernel checks the effective set for privileged operations. This design lets a program receive exactly the privilege it needs instead of full root, dramatically reducing the impact of a flaw. The mental model: root is a bundle of powers, and capabilities let you hand out one slice. Because `CAP_SYS_ADMIN` and `CAP_DAC_OVERRIDE` are so broad, granting them is close to granting root and deserves the same scrutiny.

## Method
1. Identify the specific privileged operation a program needs.
2. Map it to the narrowest capability that permits it.
3. Attach file capabilities with `setcap` or restrict a service with systemd directives.
4. Inspect the resulting sets with `getcap` and `/proc/<pid>/status`.
5. Drop everything not required using `CapabilityBoundingSet=` and `AmbientCapabilities=`.

## Example (lab only)
```bash
cp $(command -v ping) <LAB_COPY>
sudo setcap cap_net_raw+p <LAB_COPY>
getcap <LAB_COPY>
grep Cap /proc/<LAB_PID>/status
sudo setcap -r <LAB_COPY>
```

| Capability | Grants |
|------------|--------|
| CAP_NET_BIND_SERVICE | Bind ports below 1024 |
| CAP_NET_RAW | Raw sockets and packet crafting |
| CAP_SYS_ADMIN | Broad admin operations |

## Common mistakes
Granting `CAP_SYS_ADMIN` as a "safe" alternative to SUID. Expecting file capabilities to apply to shell scripts — they generally do not. Forgetting that a `nosuid` mount also disables file capabilities.

## Defense / verification
Audit file capabilities with `getcap -r /` and remove unexpected grants. Verify service capability sets in `/proc/<pid>/status` and keep bounding sets minimal.

## Knowledge check
**Q:** Which capability lets a non-root process bind port 80, and why is it preferable to SUID root?
**A:** `CAP_NET_BIND_SERVICE`; it grants only that one operation rather than all root powers.

===MODULE===
TITLE: POSIX Access Control Lists
LEVEL: Intermediate
MINUTES: 35
SUMMARY: Extend the rwx model with named users, named groups, and inheritable default ACLs for fine-grained sharing.
OBJECTIVES: Read and interpret an ACL | Set access and default ACLs | Explain the mask entry
TAKEAWAYS: ACLs add named principals beyond owner/group/other | A default ACL is inherited by new entries | The mask caps effective named permissions
PRACTICE: In your own VM, create a shared directory with a default ACL and verify that files created inside inherit the intended permissions.
SOURCES: None
---
## Core idea
Standard Unix permissions offer only one owner, one group, and everyone else, which is often too coarse. POSIX ACLs extend this with entries for named users and named groups, plus a mask entry that limits the maximum permissions available to those named entries. A plus sign (`+`) at the end of a mode string signals an ACL. Crucially, a directory can carry a default ACL; when a new file or subdirectory is created there, it inherits that ACL as its access ACL. The mental model: an ACL is an expanded permission list attached to an object, with a ceiling (the mask) applied to extra entries, and directories can pass a template to their children. ACLs require filesystem support and the `acl` utilities.

## Method
1. Read the current ACL with `getfacl` before changing anything.
2. Add named entries with `setfacl -m u:name:perms` or `g:name:perms`.
3. Set a default template with `setfacl -d -m ...` on directories.
4. Use `getfacl` to check the effective permissions column.
5. Remove entries with `-x` and clear defaults with `-k`.

## Example (lab only)
```bash
mkdir <LAB_SHARED>
setfacl -m u:<LAB_USER>:rw <LAB_SHARED>
setfacl -d -m g:<LAB_GROUP>:rwx <LAB_SHARED>
getfacl <LAB_SHARED>
touch <LAB_SHARED>/<LAB_FILE>; getfacl <LAB_SHARED>/<LAB_FILE>
```

| Entry | Purpose |
|-------|---------|
| user:: | Owner permissions |
| user:name: | Named user |
| mask:: | Ceiling for named entries |
| default: | Template inherited by children |

## Common mistakes
Ignoring the mask and wondering why a named user's `rwx` shows as effective `r-x`. Expecting default ACLs to affect files that already existed. Backing up files with tools that discard ACLs.

## Defense / verification
Review ACLs recursively on shared data with `getfacl -R`, and document expected named principals. Verify inheritance by creating a test file and checking its effective permissions.

## Knowledge check
**Q:** A named user is granted `rwx` but the mask is `r-x`. What is their effective permission?
**A:** `r-x` — the mask caps named-user and named-group permissions.

===MODULE===
TITLE: Path Resolution, Symlinks, and TOCTOU Races
LEVEL: Advanced
MINUTES: 45
SUMMARY: Learn how paths are resolved component by component and why check-then-use patterns create exploitable race conditions.
OBJECTIVES: Trace multi-component path resolution | Explain symlink redirection risks | Avoid time-of-check to time-of-use bugs
TAKEAWAYS: A path is a sequence of directory lookups, not an identity | Symlinks can redirect a lookup mid-path | Use descriptors and atomic flags, not repeated path strings
PRACTICE: In your own VM, write a small program that opens a file safely using O_NOFOLLOW and O_EXCL, contrasting it with a naive name-based approach.
SOURCES: None
---
## Core idea
When the OS resolves a path such as `/a/b/c`, it walks each component, looking up a name in a directory to obtain the next inode. A symbolic link encountered along the way redirects the walk to its stored target. This means a path string is a recipe for reaching an object, not a stable identity for it. A time-of-check to time-of-use (TOCTOU) flaw appears when code checks a property using a path and later uses the same path for an action: an attacker with write access to an intermediate directory can swap a symlink between the two operations. The mental model: between check and use, the filesystem can change, so bind the object once using a file descriptor and operate on that descriptor thereafter.

## Method
1. Break a path into components and note which directories are writable by others.
2. Identify any check-then-use sequence in the code.
3. Replace path-based reuse with an open file descriptor.
4. Use `O_NOFOLLOW` to refuse symlinks on the final component and `O_EXCL` for atomic creation.
5. Create temporary files inside a private, mode-0700 directory.

## Example (lab only)
```bash
namei -l /<LAB_PATH>/<LAB_FILE>
readlink -f <LAB_LINK>
python3 -c 'import tempfile; d=tempfile.mkdtemp(); print(d)'
```

| Pattern | Risk | Safer approach |
|---------|------|----------------|
| Check path then open path | TOCTOU | Open once, use fd |
| Predictable temp name | Symlink attack | mkdtemp / O_EXCL |
| Follow symlinks blindly | Redirection | O_NOFOLLOW |

## Common mistakes
Assuming a path that existed during validation still points to the same file. Building temp files in world-writable `/tmp` with predictable names. Using relative paths from an untrusted working directory.

## Defense / verification
Prefer descriptor-based APIs (`openat`, `fstat`), private temp directories, and atomic flags. Verify by auditing your own code for repeated filename lookups between checks and actions.

## Knowledge check
**Q:** Why does `stat(path)` followed by `open(path)` have a race, and what is the fix?
**A:** The path may be swapped for a symlink between calls; open once into a descriptor and validate that descriptor.

===MODULE===
TITLE: Mounts, Filesystems, and Kernel Views
LEVEL: Intermediate
MINUTES: 35
SUMMARY: Understand how filesystems attach to the tree and how mount options and virtual filesystems support defense and inspection.
OBJECTIVES: Interpret mount options and their security effect | Navigate /proc and /sys | Verify effective mounts
TAKEAWAYS: Mount options like noexec, nosuid, and nodev are enforcement controls | /proc and /sys expose kernel state as files | findmnt reveals the active mount table
PRACTICE: In your own VM, inspect the mount table and identify which writable locations lack noexec or nosuid protections.
SOURCES: None
---
## Core idea
A filesystem becomes visible when it is mounted at a directory, called the mount point. Mount options shape security behavior: `noexec` prevents executing binaries from that filesystem, `nosuid` ignores SUID/SGID bits and file capabilities, and `nodev` blocks device files. These options are a primary defense for writable areas such as `/tmp` and `/home`. Two special filesystems are not stored on disk: `/proc` exposes process and kernel state as readable text, and `/sys` exposes device and driver attributes. The mental model: the directory tree is an assembly of independently governed regions, and some regions are live windows into kernel data rather than stored files. Understanding mounts explains why a permission change may not behave as expected across a boundary.

## Method
1. List mounts with `findmnt` and locate writable filesystems.
2. Check for `noexec`, `nosuid`, and `nodev` on each.
3. Recognize bind mounts that expose the same data at another path.
4. Use `/proc` to inspect processes and `/sys` to inspect hardware settings.
5. Treat virtual files as read-mostly interfaces governed by the kernel.

## Example (lab only)
```bash
findmnt -o TARGET,SOURCE,FSTYPE,OPTIONS
grep -E '/tmp|/home' /proc/mounts
cat /proc/sys/kernel/randomize_va_space
```

| Option | Blocks |
|--------|--------|
| noexec | Execution of files |
| nosuid | SUID/SGID and file capabilities |
| nodev | Device special files |

## Common mistakes
Applying `noexec` to `/home` but forgetting `/tmp` or `/dev/shm`. Assuming bind-mounted paths inherit options from their original mount. Attempting to chmod entries in `/proc` as if they were regular files.

## Defense / verification
Harden writable mounts with `noexec,nosuid,nodev` where practical and verify with `findmnt` after reboot. Check `/proc/mounts` rather than relying on stale fstab assumptions.

## Knowledge check
**Q:** Which single mount option prevents both SUID binaries and file capabilities from taking effect?
**A:** `nosuid`.

===MODULE===
TITLE: File Descriptors, Redirection, and Pipes
LEVEL: Beginner
MINUTES: 30
SUMMARY: Learn that I/O is handled through file descriptors and how shells manipulate them for redirection and pipelines.
OBJECTIVES: Explain the per-process file descriptor table | Predict redirection results | Describe how pipes connect processes
TAKEAWAYS: File descriptors are integer handles to open objects | 0, 1, 2 are stdin, stdout, stderr | Redirection reassigns descriptors before a command runs
PRACTICE: In your own VM, combine stdout and stderr redirection in different orders and observe why the results differ, then list a shell's open descriptors.
SOURCES: None
---
## Core idea
Every process has a table of file descriptors, integer handles that refer to open files, sockets, pipes, or devices. By convention, descriptor 0 is standard input, 1 is standard output, and 2 is standard error. Opening a file returns the lowest free descriptor. The shell performs redirection by duplicating descriptors before launching a command: `>` redirects stdout, `2>` redirects stderr, and `2>&1` makes stderr go where stdout currently points, so order matters. A pipe creates a kernel buffer with a read end and a write end, connecting the stdout of one process to the stdin of the next. The mental model: processes do not name files when writing — they write to handles, and the shell wires those handles up in advance. This also explains why `/proc/<pid>/fd` is such a useful inspection point.

## Method
1. Identify the default destination of each standard descriptor.
2. Determine the order of redirection operators left to right.
3. Trace a pipeline as a chain of descriptor connections.
4. Inspect a process's open descriptors to find hidden files or sockets.
5. Close unneeded descriptors to avoid leaking handles to children.

## Example (lab only)
```bash
<LAB_CMD> > <LAB_OUT> 2>&1
<LAB_CMD> 2>&1 > <LAB_OUT>
ls -l /proc/$$/fd
```

| Operator | Effect |
|----------|--------|
| `>` | Redirect stdout |
| `2>` | Redirect stderr |
| `2>&1` | Send stderr to stdout's target |
| `\|` | Pipe stdout to next stdin |

## Common mistakes
Writing `2>&1 > file` and expecting both streams in the file. Assuming a pipe carries stderr by default. Forgetting that descriptors are inherited by child processes unless marked close-on-exec.

## Defense / verification
Audit unexpected open descriptors with `ls -l /proc/<pid>/fd`. Avoid logging sensitive data through broad `2>&1` captures, and close descriptors explicitly in long-running processes.

## Knowledge check
**Q:** Why does `cmd 2>&1 > out` leave errors on the terminal?
**A:** `2>&1` is applied first, pointing stderr at the original stdout; then stdout alone is redirected to `out`.

===MODULE===
TITLE: Process Lifecycle: fork, exec, and Exit
LEVEL: Intermediate
MINUTES: 35
SUMMARY: Trace how Linux processes are created and replaced, and why the fork-exec model matters for process inspection.
OBJECTIVES: Describe fork and exec semantics | Explain copy-on-write and process states | Interpret parent-child relationships
TAKEAWAYS: fork duplicates a process; exec replaces its program image | Copy-on-write makes duplication cheap | A child that exits before being waited for becomes a zombie
PRACTICE: In your own VM, write a tiny script that forks a child, prints both PIDs, and observes the child's state before and after it is reaped.
SOURCES: None
---
## Core idea
New Linux processes are created by `fork()`, which produces a near-identical child with its own address space, created efficiently through copy-on-write: pages are shared until one side writes. The child then usually calls `exec()` to replace its image with a new program, preserving its PID and many attributes such as credentials and file descriptors. When a process finishes, it becomes a zombie until its parent calls `wait()` to collect its exit status; if the parent dies, the child is reparented to init or systemd, which reaps it. The mental model: processes are born by duplication, transformed by replacement, and cleaned up by an explicit wait. This is why process ancestry and state columns in `ps` carry real diagnostic meaning.

## Method
1. Identify the parent of a process and explain how it was launched.
2. Note that exec preserves PID, credentials, and open descriptors unless changed.
3. Observe child state transitions with `ps` or `/proc/<pid>/status`.
4. Confirm that zombies remain until reaped by the parent.
5. Recognize that shells fork for every external command.

## Example (lab only)
```bash
ps -eo pid,ppid,stat,cmd | grep <LAB_NAME>
awk '/State|PPid/' /proc/<LAB_PID>/status
python3 -c 'import os; pid=os.fork(); print(pid, os.getpid())'
```

| State | Meaning |
|-------|---------|
| R | Running or runnable |
| S | Interruptible sleep |
| Z | Zombie, awaiting reap |

## Common mistakes
Expecting exec to create a new PID — it reuses the caller's. Leaving children unreaped in daemons. Assuming forked children automatically get fresh credentials, which can be a security hazard if the parent is privileged.

## Defense / verification
Verify that service managers reap children and that `Restart=` policies exist where needed. Use process limits (`ulimit -u`) in your lab to contain accidental fork storms.

## Knowledge check
**Q:** After `fork()` then `exec()`, is the PID the parent's, the child's, or new?
**A:** The child keeps its own new PID from fork; exec does not change it.

===MODULE===
TITLE: Signals, Process States, and Zombies
LEVEL: Intermediate
MINUTES: 35
SUMMARY: Learn the signal mechanism, default actions, and the process states you will see during incident triage.
OBJECTIVES: List common signals and their default actions | Distinguish catchable and uncatchable signals | Diagnose zombies and uninterruptible sleeps
TAKEAWAYS: Signals are asynchronous software notifications | SIGKILL and SIGSTOP cannot be caught or ignored | A zombie has exited but not been reaped
PRACTICE: In your own VM, send SIGTERM and then SIGKILL to a harmless test process and record how its state changes.
SOURCES: None
---
## Core idea
Signals are short asynchronous notifications delivered to a process. Each signal has a default action — terminate, stop, continue, ignore, or dump core — but most can be caught or ignored by the process. Two exceptions are essential: SIGKILL (9) and SIGSTOP cannot be caught, blocked, or ignored, which makes them reliable last resorts. A process that has exited but whose parent has not yet called `wait()` appears in state Z, a zombie; it consumes only a table entry. State D means uninterruptible sleep, usually waiting on I/O, and even SIGKILL cannot take effect until the kernel call returns. The mental model: signals are requests except for the two unconditional ones, and process state tells you what a process is actually doing.

## Method
1. Check the process state before acting.
2. Send a polite termination signal first and allow cleanup.
3. Verify the process exited and its parent reaped it.
4. Escalate to SIGKILL only if necessary.
5. Investigate persistent D-state processes as possible storage or driver problems.

## Example (lab only)
```bash
kill -l
kill -TERM <LAB_PID>; sleep 1; ps -o pid,stat,cmd -p <LAB_PID>
kill -KILL <LAB_PID>
ps -eo pid,ppid,stat,cmd | awk '$3 ~ /Z/'
```

| Signal | Number | Default |
|--------|--------|---------|
| SIGTERM | 15 | Terminate, catchable |
| SIGKILL | 9 | Terminate, uncatchable |
| SIGSTOP | 19 | Stop, uncatchable |

## Common mistakes
Using `kill -9` immediately and denying processes a chance to flush data. Mistaking a zombie for a still-running process and repeatedly killing it. Ignoring a D-state process that indicates failing storage.

## Defense / verification
Confirm termination with `kill -0` or `ps`, and ensure parents reap children. In your lab, prefer SIGTERM and reserve SIGKILL for verification-backed escalation.

## Knowledge check
**Q:** Which two signals cannot be caught, blocked, or ignored?
**A:** SIGKILL (9) and SIGSTOP (19).

===MODULE===
TITLE: Job Control and Background Execution
LEVEL: Beginner
MINUTES: 25
SUMMARY: Understand how shells group processes into jobs and manage foreground and background execution tied to a terminal.
OBJECTIVES: Manage foreground and background jobs | Explain process groups and SIGHUP | Keep work running after logout
TAKEAWAYS: A job is a shell-managed process group | Only the foreground group reads from the terminal | Background jobs receive SIGHUP when the shell exits
PRACTICE: In your own VM, start a long-running command in the background, suspend and resume it, then disconnect and observe the effect of nohup.
SOURCES: None
---
## Core idea
An interactive shell organizes pipelines into jobs, each a process group with an ID. Only the foreground job receives terminal input and can read from the keyboard; background jobs run without it and are stopped if they attempt to read. `Ctrl-Z` stops the foreground job and `bg` resumes it in the background, while `fg` brings it forward. When a terminal disconnects, the shell sends SIGHUP to its jobs, which normally terminates them. `nohup` ignores that signal and `setsid` detaches the process into a new session, while terminal multiplexers such as tmux keep a persistent session alive. The mental model: the terminal is a shared resource governed by a foreground group, and jobs must be explicitly detached to survive disconnection.

## Method
1. Launch a command with `&` to place it in the background.
2. List jobs and note their state with `jobs`.
3. Suspend and resume using `Ctrl-Z`, `bg`, and `fg`.
4. Use `nohup` or `setsid` for work that must survive logout.
5. Verify with `ps` that the process persists after the shell exits.

## Example (lab only)
```bash
sleep 300 &
jobs
fg %1
nohup <LAB_CMD> > <LAB_OUT> 2>&1 &
setsid <LAB_CMD> > <LAB_OUT> 2>&1 < /dev/null &
```

| Command | Effect |
|---------|--------|
| `&` | Start in background |
| `Ctrl-Z` | Stop foreground job |
| `bg` / `fg` | Resume background / foreground |
| `nohup` | Ignore hangup on logout |

## Common mistakes
Expecting a background job to read from stdin. Losing a long task when an SSH session closes. Forgetting to redirect output, leaving a job blocked on a full terminal buffer.

## Defense / verification
Use tmux or setsid for durable work and verify persistence with `ps` after disconnecting. Avoid leaving privileged background jobs running unattended in shared environments.

## Knowledge check
**Q:** Why does a plain background job die when you log out, and what prevents it?
**A:** The shell sends SIGHUP on exit; `nohup` or `setsid` prevents termination.

===MODULE===
TITLE: systemd Units, Targets, and Service Management
LEVEL: Intermediate
MINUTES: 40
SUMMARY: Learn the systemd unit model, target goals, and the commands used to inspect and control services safely.
OBJECTIVES: Explain unit types and target goals | Read a service unit file | Start, enable, and verify a service
TAKEAWAYS: systemd manages resources called units | Targets group units in place of runlevels | State changes require daemon-reload when unit files change
PRACTICE: In your own VM, create a minimal user service unit, enable it, and verify it starts at boot using systemctl status.
SOURCES: None
---
## Core idea
systemd is the init system and service manager on most modern Linux distributions. It manages resources called units, of which the common types are `service` (a process), `socket`, `timer`, `mount`, and `target`. A target is a synchronization point grouping other units, replacing traditional runlevels; `multi-user.target` and `graphical.target` are the familiar ones. A unit file has `[Unit]`, `[Service]` (or the matching type section), and `[Install]` sections describing dependencies, execution, and enablement. The mental model: systemd is a dependency-driven state machine that brings the system to a target by starting the necessary units, and `systemctl` is its control and inspection interface.

## Method
1. Identify the unit type and the target that pulls it in.
2. Read the unit file to see `ExecStart`, `User`, and dependencies.
3. Check current state with `systemctl status`.
4. After editing a unit, run `daemon-reload`, then restart and enable.
5. Confirm the unit is both active now and enabled for boot.

## Example (lab only)
```bash
systemctl status <LAB_SERVICE>.service
systemctl cat <LAB_SERVICE>.service
sudo systemctl daemon-reload
sudo systemctl enable --now <LAB_SERVICE>.service
systemctl is-enabled <LAB_SERVICE>.service
```

| Command | Purpose |
|---------|---------|
| `status` | Show active state and recent logs |
| `cat` | Print effective unit file |
| `enable --now` | Enable at boot and start |
| `daemon-reload` | Reread changed unit files |

## Common mistakes
Editing files under `/usr/lib/systemd` instead of `/etc/systemd/system`. Forgetting `daemon-reload` so changes are ignored. Confusing enabled (starts at boot) with active (running now).

## Defense / verification
Verify services with `systemctl status` and `is-enabled`, and review units running as root for unnecessary privileges. Check for unexpected new units as part of a baseline audit.

## Knowledge check
**Q:** After editing a unit file, what command makes systemd read the change, and what distinguishes enabled from active?
**A:** `systemctl daemon-reload`; enabled means it starts at boot, active means it is running now.

===MODULE===
TITLE: systemd Service Hardening Directives
LEVEL: Advanced
MINUTES: 45
SUMMARY: Apply systemd sandboxing directives to reduce what a compromised service can reach, and verify each restriction.
OBJECTIVES: Explain key hardening directives | Add directives to a service unit | Verify their effect at runtime
TAKEAWAYS: NoNewPrivileges blocks privilege gain via SUID and file capabilities | ProtectSystem and ProtectHome make paths read-only | PrivateTmp isolates a service's temporary directory
PRACTICE: In your own VM, harden a test service with NoNewPrivileges, PrivateTmp, and ProtectSystem=strict, then verify the restrictions from inside the service.
SOURCES: None
---
## Core idea
systemd can apply sandboxing to a service without changing the application itself. Each directive narrows the service's view of the system: `NoNewPrivileges=yes` prevents gaining privileges through SUID or file capabilities, `PrivateTmp=yes` gives the service an isolated `/tmp`, `ProtectSystem=strict` mounts most of the filesystem read-only, `ProtectHome=yes` hides home directories, and `CapabilityBoundingSet=` limits available kernel capabilities. Other useful controls include `RestrictAddressFamilies=`, `ReadOnlyPaths=`, and `UMask=`. The mental model: systemd wraps a service in a policy envelope, so a flaw in the application is contained by the manager rather than relying solely on the application's own discipline. Directives are cumulative, and a small number of well-chosen ones remove entire classes of post-compromise action.

## Method
1. Determine what the service legitimately needs to read, write, and connect.
2. Add directives in a drop-in under `/etc/systemd/system/<unit>.d/`.
3. Apply `daemon-reload` and restart the service.
4. Verify behavior with `systemctl show` and by testing from inside the service.
5. Read the service journal for denials and relax only what is necessary.

## Example (lab only)
```bash
sudo mkdir -p /etc/systemd/system/<LAB_SERVICE>.service.d
sudo tee /etc/systemd/system/<LAB_SERVICE>.service.d/hardening.conf >/dev/null <<'CONF'
[Service]
NoNewPrivileges=yes
PrivateTmp=yes
ProtectSystem=strict
ProtectHome=yes
CONF
sudo systemctl daemon-reload
sudo systemctl restart <LAB_SERVICE>.service
systemctl show -p NoNewPrivileges -p PrivateTmp <LAB_SERVICE>.service
```

| Directive | Effect |
|-----------|--------|
| NoNewPrivileges | Blocks SUID/capability escalation |
| ProtectSystem=strict | Read-only filesystem except API paths |
| PrivateTmp | Isolated temporary directory |

## Common mistakes
Enabling `ProtectSystem=strict` without granting write access to a needed data path. Forgetting `daemon-reload`, so new directives never apply. Assuming these controls replace patching — they are defense in depth, not a fix.

## Defense / verification
Verify effective settings with `systemctl show` and `/proc/<pid>/status`. Use `systemd-analyze security <unit>` to score exposure and track improvements over time.

## Knowledge check
**Q:** Which single directive prevents a service from gaining privileges via an SUID helper?
**A:** `NoNewPrivileges=yes`.

===MODULE===
TITLE: Timers, Cron, and Scheduled Execution
LEVEL: Intermediate
MINUTES: 30
SUMMARY: Compare cron and systemd timers, learn to audit scheduled jobs, and understand the security implications of scheduled execution.
OBJECTIVES: List scheduled jobs on a system | Explain cron versus systemd timers | Audit schedules for excessive privilege
TAKEAWAYS: Cron uses time-based expressions in crontab files | systemd timers use monotonic or calendar triggers | Scheduled jobs often run with elevated privileges
PRACTICE: In your own VM, create a user crontab entry and a systemd user timer, then list both and confirm their schedules.
SOURCES: None
---
## Core idea
Scheduled execution is a common persistence and automation mechanism. Cron evaluates time expressions from per-user crontabs and system-wide files under `/etc/cron.*`, launching commands with the privileges of the owning user. systemd timers offer a more expressive alternative: a `.timer` unit triggers a matching `.service` unit using `OnCalendar`, `OnBootSec`, or monotonic timers, and integrates with journald logging and dependencies. `at` handles one-off jobs. The mental model: a scheduler is a privileged launcher that runs commands on a timer, so the combination of who schedules, what runs, and with what identity determines risk. Auditing schedules means checking every user's crontab, system cron directories, and all timer units.

## Method
1. Enumerate per-user crontabs and `/etc/crontab` and `/etc/cron.d`.
2. List systemd timers with `systemctl list-timers --all`.
3. Check `at` queues with `atq`.
4. For each job, record the owner, command, working directory, and environment.
5. Flag jobs running as root from writable scripts or directories.

## Example (lab only)
```bash
crontab -l
sudo ls -l /etc/cron.d /etc/cron.daily
systemctl list-timers --all
atq
```

| Mechanism | Trigger | Audit command |
|-----------|---------|---------------|
| Cron | Time expression | `crontab -l`, `/etc/cron.*` |
| systemd timer | Calendar / monotonic | `systemctl list-timers` |
| at | One-off time | `atq` |

## Common mistakes
Ignoring root's crontab when auditing. Forgetting that scripts invoked by cron inherit a minimal environment. Assuming a timer unit is harmless without inspecting the service it activates.

## Defense / verification
Maintain an inventory of expected scheduled jobs and alert on changes. Verify that scheduled scripts are root-owned and not writable by unprivileged users, using `find /etc/cron* -perm -0002`.

## Knowledge check
**Q:** Which command lists all systemd timers including inactive ones?
**A:** `systemctl list-timers --all`.

===MODULE===
TITLE: Linux Logging with journald and syslog
LEVEL: Intermediate
MINUTES: 35
SUMMARY: Understand how Linux logs are collected, structured, and queried so you can reconstruct events reliably.
OBJECTIVES: Explain journald and syslog roles | Query journals with filters | Verify log persistence and integrity
TAKEAWAYS: journald collects structured records with metadata | syslog daemons route messages to files or forwarders | Logs need persistence configuration to survive reboot
PRACTICE: In your own VM, generate a test log entry, find it with journalctl filters, then configure persistent journal storage and verify it survives a reboot.
SOURCES: None
---
## Core idea
Modern Linux logging has two layers. The kernel and services emit messages through the journal; systemd-journald captures them with structured metadata such as unit name, PID, UID, and priority. Traditional syslog daemons (rsyslog or syslog-ng) read those messages and write text files under `/var/log` or forward them to a central collector. By default some distributions store journals only in memory under `/run`, so enabling `Storage=persistent` in `journald.conf` is important for investigations. The mental model: journald is the structured ingestion point, syslog is routing and persistence, and `/var/log` files are the human-readable output. Effective querying depends on understanding the metadata fields rather than grepping raw text.

## Method
1. Confirm whether journal storage is volatile or persistent.
2. Query by unit, time window, priority, or PID using journalctl.
3. Use ` -f ` to follow logs live during a test.
4. Inspect traditional log files for comparison.
5. Correlate across sources using timestamps and identifiers.

## Example (lab only)
```bash
journalctl -u <LAB_SERVICE>.service --since "1 hour ago"
journalctl _PID=<LAB_PID> -o json
sudo journalctl -f -u <LAB_SERVICE>.service
ls -l /var/log
```

| Field | Use |
|-------|-----|
| `_UNIT` | Filter by service |
| `_PID` | Filter by process |
| `_UID` | Filter by user |
| `PRIORITY` | Filter by severity |

## Common mistakes
Assuming all distributions persist journals by default. Relying on `grep` alone and losing structured fields. Ignoring clock synchronization, which breaks cross-host correlation.

## Defense / verification
Enable persistent storage and remote forwarding, restrict log file permissions, and verify timestamps with `timedatectl`. In your lab, confirm a rebooted system still shows earlier entries.

## Knowledge check
**Q:** What journald setting makes logs survive a reboot, and which journalctl option filters by service unit?
**A:** `Storage=persistent` in `journald.conf`; `-u <unit>` filters by unit.

===MODULE===
TITLE: auditd and Linux Audit Rules
LEVEL: Advanced
MINUTES: 45
SUMMARY: Learn how the kernel audit subsystem records security-relevant events and how to write and query audit rules.
OBJECTIVES: Explain the audit subsystem architecture | Write basic audit rules | Search and report on audit events
TAKEAWAYS: auditd receives kernel audit records via netlink | Rules select syscalls, files, or users to watch | ausearch and aureport turn raw records into findings
PRACTICE: In your own VM, add a watch rule on a sensitive file, trigger it, and locate the resulting event with ausearch.
SOURCES: None
---
## Core idea
The Linux audit subsystem is a kernel facility that emits records for configured security events, which the auditd daemon collects to disk. Unlike application logs, audit records are generated by the kernel and include fields such as syscall number, PID, UID, audit login UID (auid), and success or failure. Rules loaded with `auditctl` or stored in `/etc/audit/rules.d/` select what to record: syscall rules, filesystem watches, and filters by user or architecture. The mental model: audit is a kernel-level observation layer independent of the program being watched, which makes it valuable for detecting access to sensitive files even if the application logs nothing. `ausearch` queries records by key or time, and `aureport` summarizes them.

## Method
1. Check that auditd is running and inspect current rules.
2. Add a watch or syscall rule, assigning a `-k` key for easy lookup.
3. Trigger the event in your own lab.
4. Search using the key and examine the record fields.
5. Generate a summary report to confirm the event was captured.

## Example (lab only)
```bash
sudo systemctl status auditd
sudo auditctl -l
sudo auditctl -w <LAB_FILE> -p wa -k <LAB_KEY>
touch <LAB_FILE>; echo test >> <LAB_FILE>
sudo ausearch -k <LAB_KEY> | tail -20
```

| Rule flag | Meaning |
|-----------|---------|
| `-w path` | Watch a path |
| `-p wa` | Watch write and attribute changes |
| `-k key` | Tag for searching |
| `-S` | Select a syscall |

## Common mistakes
Forgetting to persist rules in `/etc/audit/rules.d/`, so they vanish on reboot. Creating overly broad syscall rules that flood disk. Ignoring the `auid` field, which tracks the original login user across su/sudo.

## Defense / verification
Verify rules after reboot and monitor audit disk usage. In your lab, confirm the tagged event appears with `ausearch` and that log rotation is configured.

## Knowledge check
**Q:** Which audit field preserves the original login user after a sudo escalation?
**A:** `auid`, the audit login UID.

===MODULE===
TITLE: SSH Hardening and Key-Based Access
LEVEL: Intermediate
MINUTES: 40
SUMMARY: Harden SSH by configuring the daemon, managing keys, and verifying that weak authentication paths are removed.
OBJECTIVES: Identify weak SSH defaults | Configure key-based authentication | Verify a hardened sshd_config
TAKEAWAYS: Disable password and root login where keys are established | Restrict users and forwarding features | Always validate config syntax before restarting
PRACTICE: In your own VM, generate an SSH keypair, install the public key, disable password authentication, and confirm key-only login works before closing your session.
SOURCES: None
---
## Core idea
SSH is a common remote administration entry point, so its configuration deserves careful hardening. The daemon reads `/etc/ssh/sshd_config`, where settings control authentication methods, permitted users, protocol features, and cryptographic policy. The strongest practical posture uses public-key authentication, disables direct root login (`PermitRootLogin no`), disables password authentication (`PasswordAuthentication no`) once keys are verified, and restricts access with `AllowUsers` or `AllowGroups`. Features not needed, such as agent forwarding or X11 forwarding, should be disabled. The mental model: every enabled authentication path and forwarding feature is an attack surface, and hardening is the deliberate removal of paths you do not need. A critical operational rule is to validate configuration and keep an existing session open before restarting the daemon.

## Method
1. Inventory current settings with `sshd -T`.
2. Generate a strong key pair and install the public key for your lab user.
3. Verify key-based login works in a separate session.
4. Edit `sshd_config` to remove unwanted authentication and forwarding paths.
5. Validate syntax with `sshd -t` and reload, then retest.

## Example (lab only)
```bash
ssh-keygen -t ed25519 -f <LAB_KEYFILE>
ssh-copy-id -i <LAB_KEYFILE>.pub <LAB_USER>@<LAB_HOST>
sudo sshd -t
sudo grep -E 'PermitRootLogin|PasswordAuthentication|AllowUsers' /etc/ssh/sshd_config
sudo systemctl reload sshd
```

| Setting | Hardened value |
|---------|----------------|
| PermitRootLogin | no |
| PasswordAuthentication | no |
| X11Forwarding | no |
| AllowUsers | explicit list |

## Common mistakes
Disabling passwords before confirming key login, causing lockout. Restarting sshd without `sshd -t` validation. Leaving old unauthorized keys in `authorized_keys`.

## Defense / verification
Use `sshd -T` to confirm effective settings and review `authorized_keys` ownership and modes. Monitor authentication logs for brute-force attempts and consider rate limiting.

## Knowledge check
**Q:** What command validates sshd configuration before a reload, and what does it check?
**A:** `sshd -t`; it parses the config and checks host keys for syntax and usability errors.

===MODULE===
TITLE: sudo, sudoers, and Privilege Control
LEVEL: Intermediate
MINUTES: 40
SUMMARY: Understand how sudo grants controlled elevated execution and how to configure and audit it safely.
OBJECTIVES: Read sudoers syntax and precedence | Grant narrow command privileges | Avoid common escalation pitfalls
TAKEAWAYS: sudoers rules specify who may run which commands as which user | Wildcards and shell escapes can defeat narrow grants | sudo logs commands for accountability
PRACTICE: In your own VM, create a sudoers rule allowing a single harmless command, test it, and inspect the resulting sudo log entry.
SOURCES: None
---
## Core idea
sudo lets an authorized user run a command as another user, typically root, under a policy defined in `/etc/sudoers` and files in `/etc/sudoers.d`. A rule has the form `who host=(as_user) commands`, optionally with tags such as `NOPASSWD`. sudo is a major escalation surface because a poorly scoped rule grants more power than intended: allowing an editor, interpreter, or any command with wildcard arguments often provides a path to a full shell, since many programs can spawn subprocesses. The mental model: sudo is a policy-driven privilege broker, and the true scope of a grant is determined by what the allowed program can do, not by its name. sudo also records commands and maintains a timestamp cache that can be configured.

## Method
1. Inspect existing rules with `sudo -l -U <user>`.
2. Identify the exact command and arguments required.
3. Write a narrow rule in a dedicated file under `/etc/sudoers.d/`.
4. Validate with `visudo -c` before relying on it.
5. Test the grant and review the resulting log entry.

## Example (lab only)
```bash
sudo visudo -f /etc/sudoers.d/<LAB_RULE>
# <LAB_USER> ALL=(root) /usr/bin/systemctl status <LAB_SERVICE>
sudo -l -U <LAB_USER>
visudo -c
sudo journalctl -t sudo | tail -5
```

| Tag | Effect |
|-----|--------|
| NOPASSWD | Skip password prompt |
| RUNAS | Specify target user |
| Defaults | Global behavior settings |

## Common mistakes
Granting `ALL` when one command suffices. Allowing editors or interpreters, which enable shell escape. Using `NOPASSWD` for broad commands without understanding the risk.

## Defense / verification
Keep rules minimal and explicit, verify syntax with `visudo -c`, and review sudo logs regularly. In your lab, confirm that a disallowed command is actually denied.

## Knowledge check
**Q:** Why is granting sudo access to a text editor effectively granting a shell?
**A:** Editors typically allow spawning a shell or executing commands, escaping the intended restriction.

===MODULE===
TITLE: AppArmor and SELinux Mandatory Access Control
LEVEL: Advanced
MINUTES: 50
SUMMARY: Compare the two major Linux MAC systems and learn to inspect profiles, labels, and enforcement state.
OBJECTIVES: Explain DAC versus MAC | Inspect AppArmor profiles and SELinux contexts | Switch between enforcing and complain modes
TAKEAWAYS: MAC constrains even root according to policy | AppArmor uses path-based profiles; SELinux uses labels | Denials are recorded for diagnosis
PRACTICE: In your own VM, put an AppArmor profile into complain mode for a test binary, trigger an action, and read the resulting denial in the log.
SOURCES: None
---
## Core idea
Discretionary access control (DAC) is the familiar owner/group/other model, where the owner can change permissions. Mandatory access control (MAC) adds a system-wide policy that even root cannot override. Two implementations dominate. AppArmor attaches path-based profiles to executables, listing which files and capabilities the program may access. SELinux assigns labels to every subject and object and enforces type enforcement rules between them. Both operate in enforcing or complain/permissive mode, the latter logging would-be denials without blocking them. The mental model: MAC is a second, independent gate after DAC, so an action must satisfy both to succeed. Understanding denials requires reading the audit or journal records that MAC systems emit.

## Method
1. Determine which MAC system is active on the host.
2. Check its global enforcement mode.
3. Inspect the profile or label attached to a process.
4. Reproduce an action and read the denial record.
5. Adjust policy in complain/permissive mode first, then enforce.

## Example (lab only)
```bash
sudo aa-status
sudo aa-complain <LAB_PROFILE>
sudo journalctl -k | grep -i apparmor
getenforce
ls -Z <LAB_FILE>
```

| Aspect | AppArmor | SELinux |
|--------|----------|---------|
| Model | Path-based profiles | Label-based types |
| State tool | `aa-status` | `getenforce` |
| Log | Kernel/audit | audit (`AVC`) |

## Common mistakes
Assuming root bypasses MAC — it does not. Switching to enforcing mode before testing in complain mode, causing outages. Ignoring context labels when copying files, which can leave them mislabeled.

## Defense / verification
Keep MAC in enforcing mode in production and investigate every denial rather than blindly allowing. In your lab, verify enforcement state and confirm expected denials are logged.

## Knowledge check
**Q:** Can root read a file that MAC policy denies? Why?
**A:** No. MAC is enforced by the kernel after DAC, so even UID 0 is constrained by the policy.

===MODULE===
TITLE: seccomp and Namespaces as Isolation Primitives
LEVEL: Advanced
MINUTES: 50
SUMMARY: Understand the kernel primitives behind sandboxing: seccomp syscall filters and namespaces that partition system views.
OBJECTIVES: Explain seccomp filter modes | Name the common namespace types | Relate primitives to container isolation
TAKEAWAYS: seccomp restricts which syscalls a process may make | Namespaces isolate views such as PID, mount, and network | Containers compose these primitives with cgroups
PRACTICE: In your own VM, use unshare to create a PID or mount namespace and confirm the isolated view, then run a program under a simple seccomp filter.
SOURCES: None
---
## Core idea
Modern isolation is built from kernel primitives. Seccomp (secure computing mode) attaches a filter to a process so that specified syscalls are allowed, denied, or cause process termination — a powerful way to shrink the kernel attack surface available to untrusted code. Namespaces partition a system's view: PID namespaces isolate process trees, mount namespaces isolate filesystem mounts, network namespaces isolate interfaces and routes, and user namespaces map UIDs so an unprivileged user can appear as root inside. Control groups (cgroups) complement them by limiting resources. The mental model: a sandbox is not a separate machine but a process whose view of the kernel has been deliberately narrowed using composable primitives. Containers package exactly these mechanisms, which is why understanding them clarifies both their value and their limits.

## Method
1. Identify which system resources a workload needs.
2. Choose the namespaces that isolate the views it should not see.
3. Apply a seccomp allowlist covering only required syscalls.
4. Add cgroup limits for CPU, memory, and process count.
5. Verify isolation from inside the sandbox and from outside.

## Example (lab only)
```bash
sudo unshare --pid --fork --mount-proc bash
readlink /proc/self/ns/pid
grep Seccomp /proc/<LAB_PID>/status
```

| Primitive | Isolates |
|-----------|----------|
| PID namespace | Process tree |
| Mount namespace | Filesystem mounts |
| Network namespace | Interfaces and routes |
| seccomp | Allowed syscalls |

## Common mistakes
Treating a sandbox as a complete security boundary when a kernel flaw can escape it. Forgetting that user-namespace root does not confer host root. Using overly permissive seccomp filters with default allow.

## Defense / verification
Verify `Seccomp` mode and namespace memberships under `/proc/<pid>/ns`. Keep kernels patched, since sandbox escapes typically exploit kernel vulnerabilities.

## Knowledge check
**Q:** Which primitive limits the set of syscalls a process can call?
**A:** seccomp, via an attached filter.

===MODULE===
TITLE: Windows Identity: SIDs and Accounts
LEVEL: Beginner
MINUTES: 30
SUMMARY: Learn how Windows represents identity with security identifiers and how local and domain accounts differ.
OBJECTIVES: Decode a SID and its RID | Distinguish local and domain accounts | Find well-known SIDs
TAKEAWAYS: A SID is the stable numeric identity of a principal | The RID is the trailing component identifying the account | Names can change; SIDs persist
PRACTICE: On your own Windows VM, list local accounts and their SIDs with PowerShell and identify the Administrator RID.
SOURCES: None
---
## Core idea
Windows identifies security principals — users, groups, and computers — by Security Identifiers (SIDs), not by names. A SID is a structured string such as `S-1-5-21-...-500`, where the leading components describe the authority and domain, and the trailing relative identifier (RID) identifies the specific account. Well-known RIDs are consistent: 500 is the built-in Administrator and 501 is Guest. Local accounts have SIDs scoped to the machine; domain accounts use the domain SID and are valid across the domain. Renaming an account leaves its SID unchanged, which is why authorization references SIDs rather than names. The mental model: names are display labels, while SIDs are the persistent keys used in every access check and audit record.

## Method
1. List local users and group memberships.
2. Resolve a name to its SID and back.
3. Identify the machine's domain SID portion.
4. Recognize common well-known SIDs such as Everyone and Authenticated Users.
5. Note that SID history can carry a migrated account's old SID.

## Example (lab only)
```powershell
Get-LocalUser | Select Name,SID,Enabled
$obj = New-Object System.Security.Principal.NTAccount("<LAB_USER>")
$obj.Translate([System.Security.Principal.SecurityIdentifier]).Value
whoami /user
```

| Principal | Well-known SID suffix |
|-----------|-----------------------|
| Administrator | RID 500 |
| Guest | RID 501 |
| Everyone | S-1-1-0 |

## Common mistakes
Assuming renaming an account removes its privileges — the SID keeps them. Confusing local and domain accounts with the same name. Ignoring disabled accounts that retain valuable SIDs.

## Defense / verification
Audit local accounts and alert on new RID 500-equivalent accounts or unexpected SID history entries. Verify identities with `whoami /user` when troubleshooting access.

## Knowledge check
**Q:** What happens to an account's permissions if you rename it?
**A:** They remain, because permissions are tied to the SID, which does not change on rename.

===MODULE===
TITLE: Windows Access Tokens and Impersonation
LEVEL: Intermediate
MINUTES: 40
SUMMARY: Understand access tokens, the difference between primary and impersonation tokens, and how tokens drive access checks.
OBJECTIVES: Describe token contents | Distinguish primary and impersonation tokens | Explain token-based access checks
TAKEAWAYS: A token carries the user SID, group SIDs, privileges, and integrity level | Each process has a primary token | Threads can temporarily use an impersonation token
PRACTICE: On your own Windows VM, inspect your process and thread tokens with whoami /groups and PowerShell, noting privileges and integrity level.
SOURCES: None
---
## Core idea
When a user logs on, Windows creates an access token containing the user's SID, the SIDs of their groups, a set of privileges, and an integrity level. Every process has a primary token representing its security context; when the process requests an operation, the security subsystem compares that token against the target's security descriptor. A thread can also carry an impersonation token, allowing a server to temporarily act as a client — a necessary feature for network services and also a significant security boundary. The mental model: a token is a portable bundle of identity and authority that accompanies every request, and controlling which token is in use controls what is allowed. This is why token manipulation is central to Windows privilege escalation concepts.

## Method
1. Inspect the primary token of a process with `whoami /all`.
2. List group SIDs, privileges, and their enabled state.
3. Identify the integrity level in the Mandatory Label entry.
4. Determine whether a thread is impersonating by comparing thread and process tokens.
5. Check that privileges are enabled only when required.

## Example (lab only)
```powershell
whoami /user /groups /priv
Get-Process -Id <LAB_PID> | Select Id,Path
(Get-Process <LAB_NAME>).StartInfo.Verb
```

| Token element | Purpose |
|---------------|---------|
| User SID | Primary identity |
| Group SIDs | Collective membership |
| Privileges | Specific abilities |
| Integrity level | Mandatory policy tier |

## Common mistakes
Assuming group membership changes take effect without a new logon — tokens are snapshots. Treating a disabled privilege as usable. Ignoring impersonation when analyzing which identity performed an action.

## Defense / verification
Verify tokens with `whoami /all` and audit processes running with unintended high-privilege tokens. In your lab, confirm a new logon is required after group changes.

## Knowledge check
**Q:** Why must a user log off and on again after being added to a group?
**A:** Because their existing access token is a snapshot taken at logon and does not contain the new group SID.

===MODULE===
TITLE: UAC and Integrity Levels
LEVEL: Intermediate
MINUTES: 40
SUMMARY: Learn how User Account Control splits tokens and how mandatory integrity levels constrain what processes may touch.
OBJECTIVES: Explain UAC's filtered token model | Interpret integrity levels | Identify relevant UAC policy settings
TAKEAWAYS: An elevated administrator holds both a standard and a filtered high-privilege token | Integrity levels range from Low to System | UAC is a convenience boundary, not a security boundary against the same user
PRACTICE: In your own Windows VM, run whoami /groups as a standard user and as an elevated administrator and compare the Mandatory Label and group entries.
SOURCES: None
---
## Core idea
User Account Control (UAC) changes how administrator accounts operate. When an administrator logs on, Windows issues a filtered standard-user token for most processes and keeps a separate, full administrator token that is used only after an explicit consent or credential prompt. This reduces the number of processes running with broad authority. Complementing UAC is Mandatory Integrity Control: every process and securable object carries an integrity level such as Low, Medium, High, or System. A lower-integrity process cannot write to a higher-integrity object regardless of its discretionary ACL. The mental model: UAC decides which token a process gets, and integrity level decides which objects that process may influence. UAC is explicitly designed as a convenience boundary rather than a barrier against the same authenticated user, an important nuance when reasoning about risk.

## Method
1. Determine whether the current process is elevated.
2. Inspect the Mandatory Label to read the integrity level.
3. Compare group SIDs and privileges between standard and elevated tokens.
4. Review UAC policy values such as `EnableLUA` and consent behavior.
5. Verify that routine tasks run at medium integrity and elevation is deliberate.

## Example (lab only)
```powershell
whoami /groups | findstr /i "Mandatory Label"
whoami /priv
Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System' |
  Select EnableLUA,ConsentPromptBehaviorAdmin,PromptOnSecureDesktop
```

| Integrity level | Typical owner |
|-----------------|---------------|
| Low | Sandboxed processes |
| Medium | Standard user apps |
| High | Elevated administrators |
| System | Services and system components |

## Common mistakes
Treating UAC as a hardened security boundary against a determined user of the same account. Assuming an administrator process is always elevated. Ignoring the secure desktop setting, which protects the consent prompt from spoofing.

## Defense / verification
Run daily work as a standard user and elevate only for specific tasks, using your own VM for experiments. Verify integrity levels with `whoami /groups` and keep `PromptOnSecureDesktop` enabled.

## Knowledge check
**Q:** Which integrity level do ordinary user applications normally run at?
**A:** Medium.

===MODULE===
TITLE: NTFS ACLs, Ownership, and Inheritance
LEVEL: Intermediate
MINUTES: 45
SUMMARY: Learn how Windows discretionary access control is expressed through security descriptors, DACLs, and ACE inheritance.
OBJECTIVES: Read a security descriptor and DACL | Use icacls to view and modify rights | Explain inheritance and ownership
TAKEAWAYS: A security descriptor holds owner, DACL, and SACL | DACL entries grant or deny specific access masks to SIDs | Inheritance propagates ACEs to child objects
PRACTICE: In your own VM, create a folder, grant a user modify rights with icacls, add a file, and inspect how inheritance applies.
SOURCES: None
---
## Core idea
Every NTFS object has a security descriptor containing the owner SID, a discretionary access control list (DACL), and a system access control list (SACL) used for auditing. A DACL is an ordered list of access control entries (ACEs), each binding a SID to an access mask such as read, write, or full control, with a allow or deny type. When a process requests access, Windows walks the DACL in order and accumulates granted rights; explicit deny entries take effect when encountered. ACEs can be inheritable, flowing from a parent folder to new files and subfolders, which is how broad folder permissions propagate. The mental model: access is decided by an ordered list attached to the object, with ownership providing a special right to change the DACL. This is the Windows counterpart to Unix mode bits but considerably more expressive.

## Method
1. View the effective ACL on a file or folder with `icacls` or `Get-Acl`.
2. Identify explicit versus inherited ACEs.
3. Determine the owner, who can always modify the DACL.
4. Make narrow changes with `icacls`, preserving inheritance where appropriate.
5. Verify the resulting access as the affected user in your lab.

## Example (lab only)
```powershell
icacls <LAB_DIR>
icacls <LAB_DIR> /grant '<LAB_USER>:(OI)(CI)M'
(Get-Acl <LAB_DIR>).Access | Format-Table IdentityReference,AccessControlType,FileSystemRights,IsInherited
icacls <LAB_DIR> /inheritance:d
```

| Marker | Meaning |
|--------|---------|
| OI | Object inherit, applies to files |
| CI | Container inherit, applies to folders |
| F | Full control |
| M | Modify |

## Common mistakes
Granting Full Control where Modify suffices. Breaking inheritance unintentionally and leaving orphaned permissions. Placing deny entries where a broad group membership inadvertently locks out administrators.

## Defense / verification
Review ACLs on sensitive directories with `icacls` and look for overly broad entries such as Everyone:(F). Verify ownership and inheritance after migrations, and document expected ACLs as a baseline.

## Knowledge check
**Q:** Which icacls flags make a grant apply to both files and subfolders?
**A:** `(OI)(CI)` — object inherit and container inherit.

===MODULE===
TITLE: Windows Registry Structure and Permissions
LEVEL: Intermediate
MINUTES: 35
SUMMARY: Understand registry hives and keys, and how registry ACLs protect configuration that controls system behavior.
OBJECTIVES: Describe hive and key organization | Inspect and modify registry ACLs | Identify security-sensitive keys
TAKEAWAYS: The registry is a hierarchical configuration database | Hives such as HKLM and HKCU hold machine and user settings | Keys have ACLs just like files
PRACTICE: In your own VM, inspect the ACL of a run key, add a harmless test value, and confirm who can modify it.
SOURCES: None
---
## Core idea
The Windows registry is a hierarchical database of keys and values that stores operating system and application configuration. It is divided into hives, notably `HKEY_LOCAL_MACHINE` for machine-wide settings and `HKEY_CURRENT_USER` for the interactive user. Each key holds named values with types such as string, DWORD, and binary. Crucially, registry keys are securable objects with security descriptors and ACLs, so permissions are enforced at the key level and inherited by subkeys. Certain keys are security-sensitive because they define what runs at logon or how services behave; controlling write access to them is therefore a hardening priority. The mental model: the registry is a filesystem-like tree of configuration objects, each with its own access control, and changes to it directly shape system behavior.

## Method
1. Locate the relevant hive and key path.
2. Inspect existing values and the key's ACL.
3. Determine which principals can write the key.
4. Make controlled changes with PowerShell cmdlets.
5. Verify the change and record the original state for comparison.

## Example (lab only)
```powershell
Get-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run'
(Get-Acl 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run').Access |
  Select IdentityReference,RegistryRights,AccessControlType
New-ItemProperty -Path 'HKCU:\Software\<LAB_KEY>' -Name <LAB_NAME> -Value '<LAB_VALUE>'
```

| Hive | Scope |
|------|-------|
| HKLM | Machine-wide |
| HKCU | Current user |
| HKU | All loaded user hives |

## Common mistakes
Treating registry keys as unsecured configuration. Editing HKLM without elevation and wondering why it fails. Forgetting that 32-bit and 64-bit views of the registry can differ.

## Defense / verification
Audit write permissions on auto-start and service-related keys, restrict them to administrators, and monitor for changes. In your lab, verify that an unprivileged user cannot modify an HKLM key.

## Knowledge check
**Q:** Are registry keys protected by ACLs, and which hive holds machine-wide settings?
**A:** Yes, keys have security descriptors with ACLs; HKLM holds machine-wide settings.

===MODULE===
TITLE: Built-in Windows Groups and Well-known Principals
LEVEL: Beginner
MINUTES: 25
SUMMARY: Learn the built-in groups and special identities that appear in tokens, ACLs, and audit logs.
OBJECTIVES: Name key built-in groups | Explain special identities like Everyone | Interpret nested group membership
TAKEAWAYS: Built-in groups grant baseline capabilities | Special identities describe context such as interactive or network logon | Group nesting affects effective token contents
PRACTICE: On your own Windows VM, enumerate members of the Administrators and Users groups and resolve a well-known SID to its name.
SOURCES: None
---
## Core idea
Windows ships with built-in groups that provide baseline role definitions. Administrators have full control, Users is the default for new accounts, and specialized groups such as Remote Desktop Users or Event Log Readers grant narrow capabilities. Beyond these are special well-known identities used in ACLs and tokens: Everyone includes all users, Authenticated Users excludes anonymous access, INTERACTIVE describes a locally logged-on session, and NETWORK describes network logon. These contextual identities make policies expressive, such as allowing access only to local users. Group membership can be nested, so the effective group SIDs in a token may exceed the groups explicitly listed on the account. The mental model: authorization is evaluated against the flattened set of SIDs in a token, which the OS derives from direct and nested memberships at logon.

## Method
1. Enumerate local groups and their members.
2. Identify special identities present in your token.
3. Resolve SIDs to names to interpret audit entries.
4. Note nested groups that expand effective membership.
5. Check for membership changes that require a new logon.

## Example (lab only)
```powershell
Get-LocalGroupMember -Group 'Administrators'
whoami /groups
$sid = New-Object System.Security.Principal.SecurityIdentifier('S-1-1-0')
$sid.Translate([System.Security.Principal.NTAccount]).Value
```

| Principal | Meaning |
|-----------|---------|
| Everyone | All users |
| Authenticated Users | Non-anonymous users |
| INTERACTIVE | Local logon sessions |
| NETWORK | Network logon sessions |

## Common mistakes
Granting rights to Everyone when Authenticated Users is sufficient. Overlooking nested groups when assessing who can access a resource. Assuming group changes apply to existing tokens.

## Defense / verification
Keep the Administrators group small and audit membership regularly. In your lab, verify the effective group list with `whoami /groups` after any change.

## Knowledge check
**Q:** Which special identity includes anonymous users while Authenticated Users does not?
**A:** Everyone.

===MODULE===
TITLE: Windows Services and Service Accounts
LEVEL: Intermediate
MINUTES: 40
SUMMARY: Learn how services are managed and how the choice of service account determines privilege and blast radius.
OBJECTIVES: Inspect service configuration and state | Compare built-in and virtual service accounts | Apply least privilege to services
TAKEAWAYS: The Service Control Manager starts and tracks services | Built-in accounts range from LocalService to LocalSystem | Virtual accounts and managed service accounts reduce credential exposure
PRACTICE: In your own VM, inspect a service's configuration, identify its account and binary path, and verify you can stop and start it safely.
SOURCES: None
---
## Core idea
Windows services are long-running processes managed by the Service Control Manager (SCM). Each service has a binary path, start type, dependencies, recovery actions, and an account under which it runs. Built-in service accounts form a privilege ladder: LocalService has minimal privileges, NetworkService can authenticate to the network with the machine identity, and LocalSystem is highly privileged and effectively part of the operating system. Virtual accounts and group Managed Service Accounts provide per-service identities with managed passwords, reducing credential exposure. The mental model: a service is a persistent process whose authority is defined by its account, so a compromise inherits whatever that account can do. Least privilege for services is therefore a direct control over blast radius.

## Method
1. List services and identify those running with high privilege.
2. Inspect binary path, start type, and dependencies.
3. Determine whether the account is built-in, virtual, or a named account.
4. Check recovery actions and whether the service can be stopped by users.
5. Recommend the least privileged account that still permits function.

## Example (lab only)
```powershell
Get-Service | Where-Object Status -eq 'Running'
sc.exe qc <LAB_SERVICE>
Get-CimInstance Win32_Service -Filter "Name='<LAB_SERVICE>'" |
  Select Name,StartName,PathName,StartMode
```

| Account | Relative privilege |
|---------|--------------------|
| LocalService | Low |
| NetworkService | Moderate, machine identity on network |
| LocalSystem | Very high |

## Common mistakes
Running every service as LocalSystem for convenience. Leaving service binaries in writable directories or with unquoted paths containing spaces. Ignoring recovery actions that restart a service repeatedly.

## Defense / verification
Verify service accounts with `sc.exe qc` and restrict write access to service binaries and their parent folders. In your lab, confirm a service runs under the intended least-privileged account.

## Knowledge check
**Q:** Which built-in service account is highest privilege, and what is a lower-privilege alternative for local-only work?
**A:** LocalSystem is highest; LocalService is a lower-privilege option for local-only tasks.

===MODULE===
TITLE: Scheduled Tasks and Triggers
LEVEL: Intermediate
MINUTES: 30
SUMMARY: Understand the Windows Task Scheduler, its triggers and principals, and how to audit scheduled automation.
OBJECTIVES: Describe task components | List and inspect scheduled tasks | Identify tasks running with elevated principals
TAKEAWAYS: Tasks combine triggers, actions, conditions, and a security principal | They can run whether or not a user is logged on | Elevated tasks are a persistence and privilege surface
PRACTICE: In your own VM, create a scheduled task that writes a timestamp to a file, run it once, and inspect its definition.
SOURCES: None
---
## Core idea
Windows Task Scheduler runs actions automatically based on triggers such as time, logon, boot, or an event. A task definition contains triggers, actions, conditions, settings, and a principal that determines the security context, including whether it runs with highest privileges and whether a user must be logged on. Tasks can be created by users for benign automation and by administrators for maintenance, which makes them a dual-use mechanism worth auditing. The mental model: a scheduled task is a persistent, policy-defined launcher whose authority comes from its principal, analogous to a systemd timer paired with a service. Inventorying tasks means checking both the Task Scheduler library and the underlying definitions, including hidden tasks.

## Method
1. Enumerate scheduled tasks and note their state.
2. Inspect each task's actions, triggers, and principal.
3. Flag tasks running with highest privileges from writable locations.
4. Check conditions such as "run only when user is logged on."
5. Verify whether the task's action file is protected by ACLs.

## Example (lab only)
```powershell
Get-ScheduledTask | Select TaskName,State,Author
Get-ScheduledTaskInfo -TaskName <LAB_TASK>
(Get-ScheduledTask -TaskName <LAB_TASK>).Actions
schtasks /Query /TN <LAB_TASK> /XML
```

| Component | Purpose |
|-----------|---------|
| Trigger | When the task runs |
| Action | What it executes |
| Principal | Which identity it uses |
| Conditions | Extra constraints |

## Common mistakes
Ignoring hidden tasks during an audit. Allowing an elevated task to point at a script in a user-writable folder. Assuming tasks only run while the creator is logged on.

## Defense / verification
Inventory expected tasks and alert on new ones, especially those with highest privileges. Verify action paths are in protected directories and that ACLs prevent unauthorized edits.

## Knowledge check
**Q:** Which task component determines the security context in which actions run?
**A:** The principal.

===MODULE===
TITLE: PowerShell Security and Constrained Language
LEVEL: Advanced
MINUTES: 45
SUMMARY: Learn PowerShell's security controls: execution policy, language modes, logging, and script block protection.
OBJECTIVES: Explain execution policy and its limits | Enable script block and module logging | Describe ConstrainedLanguage mode
TAKEAWAYS: Execution policy is a safety feature, not a hard security boundary | ConstrainedLanguage limits access to dangerous APIs | Script block and module logging provide visibility
PRACTICE: In your own Windows VM, enable script block logging and transcription, run a test script, and locate the logged events.
SOURCES: None
---
## Core idea
PowerShell is both an administration tool and a powerful scripting engine, so its security controls matter. Execution policy controls whether scripts may run and is intentionally a safety feature rather than a robust barrier, since it can be bypassed with command-line flags. Stronger controls include language modes: ConstrainedLanguage restricts access to arbitrary .NET types and APIs while allowing core cmdlets, significantly limiting what a script can do. Visibility comes from script block logging, module logging, and transcription, which capture the content of executed code to the Event Log. AMSI (Antimalware Scan Interface) lets security products inspect script content before execution. The mental model: execution policy shapes convenience, while language mode, logging, and AMSI shape actual security and detection.

## Method
1. Check the current execution policy and language mode.
2. Enable script block logging and module logging via policy or registry.
3. Configure transcription to capture session output.
4. Run a harmless test script and locate the generated events.
5. Consider ConstrainedLanguage or Just Enough Administration for constrained endpoints.

## Example (lab only)
```powershell
Get-ExecutionPolicy -List
$ExecutionContext.SessionState.LanguageMode
Get-WinEvent -LogName 'Microsoft-Windows-PowerShell/Operational' -MaxEvents 10
```

| Control | Role |
|---------|------|
| Execution policy | Convenience gate on script files |
| ConstrainedLanguage | Restricts APIs and .NET access |
| Script block logging | Records executed code |
| AMSI | Scans script content |

## Common mistakes
Treating execution policy as a security boundary. Enabling verbose logging without planning storage and privacy controls. Forgetting that PowerShell can be invoked from other hosts and applications.

## Defense / verification
Verify logging is enabled and events are collected centrally. In your lab, confirm a test script's content appears in the Operational log, and restrict high-privilege PowerShell use.

## Knowledge check
**Q:** Is execution policy a strong security boundary? What provides stronger constraint?
**A:** No, it is a safety feature that can be bypassed; ConstrainedLanguage mode and logging provide stronger control and visibility.

===MODULE===
TITLE: Windows Event Logs and Sysmon
LEVEL: Advanced
MINUTES: 50
SUMMARY: Use Windows Event Logs and Sysmon to reconstruct activity, with focus on high-value event IDs and field interpretation.
OBJECTIVES: Navigate Event Log channels | Recognize key security event IDs | Explain what Sysmon adds
TAKEAWAYS: Event Logs are structured channels of EVTX records | Security events cover logon, process creation, and policy changes | Sysmon adds detailed process, network, and file events
PRACTICE: In your own Windows VM, install Sysmon with a basic config, run a test process, and find its process-create event in the Sysmon log.
SOURCES: None
---
## Core idea
Windows records activity in structured channels stored as EVTX files. The Security channel includes audit events such as logons (4624), explicit process creation with command line (4688 when enabled), special privilege use (4672), and service installation (7045). The System and Application channels hold service and application events. Windows Event Forwarding can centralize these records. Sysmon, part of Sysinternals, extends visibility with high-fidelity events: process creation with hashes and parent process (Event 1), network connections (Event 3), file creation (Event 11), and DNS queries (Event 22), guided by an XML configuration. The mental model: Event Logs give broad OS-level accounting, while Sysmon gives the detailed telemetry needed to trace execution chains. Correlation depends on timestamps, user SIDs, and process GUIDs.

## Method
1. Identify which channels and event IDs are relevant to a question.
2. Query with `Get-WinEvent` using filters by ID or time.
3. Extract key fields such as user, command line, and parent process.
4. Compare Security events with Sysmon events for the same action.
5. Correlate using process IDs and GUIDs across sources.

## Example (lab only)
```powershell
Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4624} -MaxEvents 5
Get-WinEvent -LogName 'Microsoft-Windows-Sysmon/Operational' |
  Where-Object Id -eq 1 | Select-Object -First 3 TimeCreated,Message
wevtutil qe Security /c:5 /f:text
```

| Event ID | Source | Meaning |
|----------|--------|---------|
| 4624 | Security | Successful logon |
| 4688 | Security | Process creation |
| 1 | Sysmon | Process create with details |
| 22 | Sysmon | DNS query |

## Common mistakes
Looking only at the Security channel and missing Sysmon detail. Ignoring time synchronization across hosts. Assuming audit policy is enabled for all interesting events by default.

## Defense / verification
Enable process creation auditing with command lines and deploy Sysmon with a vetted config. In your lab, verify events are generated and retained, and protect logs from deletion.

## Knowledge check
**Q:** Which Sysmon event records process creation with full command line and hash?
**A:** Event ID 1.

===MODULE===
TITLE: Microsoft Defender and Attack Surface Reduction
LEVEL: Advanced
MINUTES: 45
SUMMARY: Understand Defender Antivirus protections and configure Attack Surface Reduction rules with verification.
OBJECTIVES: Explain real-time and cloud protection | Describe ASR rules and exploit protection | Verify Defender configuration
TAKEAWAYS: Defender provides real-time, cloud-delivered, and behavioral protection | ASR rules block specific high-risk behaviors | Exploit protection applies system-wide mitigations
PRACTICE: In your own Windows VM, review Defender preferences, enable a benign ASR rule in audit mode, and verify its configuration and events.
SOURCES: None
---
## Core idea
Microsoft Defender Antivirus provides real-time protection, cloud-delivered intelligence, and behavioral detection. Beyond signature scanning, several features reduce attack surface. Attack Surface Reduction (ASR) rules block specific behaviors commonly used in attacks, such as Office applications spawning child processes or executables running from email attachments. Exploit protection applies system and per-program mitigations including Data Execution Prevention, Address Space Layout Randomization, and Control Flow Guard. Controlled Folder Access restricts writes to protected folders, and Tamper Protection prevents unauthorized changes to security settings. The mental model: endpoint protection is layered — signatures catch known artifacts, ASR blocks known dangerous behaviors, and exploit mitigations make memory corruption harder to weaponize. ASR rules should be deployed in audit mode first to observe impact.

## Method
1. Review current Defender preferences and protection status.
2. Identify ASR rules relevant to your environment.
3. Deploy rules in audit mode and observe events.
4. Move to block mode for rules with no legitimate impact.
5. Verify exploit protection and tamper protection settings.

## Example (lab only)
```powershell
Get-MpPreference | Select EnableRealtimeProtection,AttackSurfaceReductionRules_Ids
Get-MpComputerStatus | Select RealTimeProtectionEnabled,AntivirusEnabled
Set-MpPreference -AttackSurfaceReductionRules_Ids <LAB_RULE_GUID> -AttackSurfaceReductionRules_Actions AuditMode
```

| Feature | Blocks / applies |
|---------|------------------|
| ASR rules | Specific risky behaviors |
| Exploit protection | DEP, ASLR, CFG |
| Controlled Folder Access | Unauthorized folder writes |
| Tamper Protection | Security setting changes |

## Common mistakes
Enabling ASR rules in block mode without an audit period, breaking line-of-business apps. Assuming real-time protection alone stops credential theft. Ignoring exclusions that weaken coverage.

## Defense / verification
Verify settings with `Get-MpPreference` and `Get-MpComputerStatus`, and review ASR events before enforcement. In your lab, confirm audit-mode events appear for the tested rule.

## Knowledge check
**Q:** Why deploy ASR rules in audit mode before block mode?
**A:** To observe which legitimate applications would be affected and avoid operational disruption.

===MODULE===
TITLE: Credential Guard, LSASS Protection, and Credential Hardening
LEVEL: Advanced
MINUTES: 45
SUMMARY: Learn how Windows protects credentials in memory and at rest, and how to verify those protections are active.
OBJECTIVES: Explain Credential Guard and LSA protection | Identify credential hardening settings | Verify protections on a system
TAKEAWAYS: Credential Guard isolates secrets using virtualization-based security | LSA Protection prevents unsigned code from reading LSASS | Disabling weak protocols reduces credential exposure
PRACTICE: In your own Windows VM, inspect Credential Guard and LSA protection settings, enable LSA protection in a test, and verify the registry state.
SOURCES: None
---
## Core idea
Windows stores and uses credentials in the Local Security Authority Subsystem Service (LSASS), making it a high-value target. Defenses operate at several layers. Credential Guard uses virtualization-based security to isolate derived credentials in a protected process, so even privileged code in the normal operating system cannot read them. LSA Protection (`RunAsPPL`) marks LSASS as a protected process, preventing unsigned or unprotected code from opening it with read access. Additional hardening includes disabling the WDigest cleartext credential cache, enabling RestrictedAdmin for remote desktop where appropriate, limiting cached domain logons, and managing local administrator passwords with Windows LAPS. The mental model: reduce both what is stored in memory and who can read it, then verify that each control is actually active rather than merely configured.

## Method
1. Check whether virtualization-based security and Credential Guard are enabled.
2. Inspect the `RunAsPPL` setting for LSA protection.
3. Review WDigest and cached credential policy.
4. Confirm local administrator password management.
5. Verify effective state with system information tools and registry queries.

## Example (lab only)
```powershell
Get-ItemProperty 'HKLM:\SYSTEM\CurrentControlSet\Control\Lsa' | Select RunAsPPL
Get-ItemProperty 'HKLM:\SYSTEM\CurrentControlSet\Control\SecurityProviders\WDigest' | Select UseLogonCredential
msinfo32
```

| Control | Protects |
|---------|----------|
| Credential Guard | Derived credentials in memory |
| RunAsPPL | LSASS process memory |
| LAPS | Local admin passwords |
| WDigest setting | Cleartext credential caching |

## Common mistakes
Assuming registry values alone mean a control is active — hardware and boot requirements matter. Enabling Credential Guard without checking virtualization support. Ignoring compatibility impacts on legacy authentication.

## Defense / verification
Verify with `msinfo32` and registry queries, and confirm reboot requirements are satisfied. In your lab, document which protections are active and investigate any that are not.

## Knowledge check
**Q:** Which setting marks LSASS as a protected process to block unsigned readers?
**A:** `RunAsPPL` under the LSA registry key.

===MODULE===
TITLE: Privilege Boundaries: User, Administrator, Kernel
LEVEL: Advanced
MINUTES: 40
SUMMARY: Map the distinct privilege layers on both platforms and understand which boundaries are enforced by hardware, the OS, or policy.
OBJECTIVES: Distinguish user, administrator, and kernel authority | Explain where each boundary is enforced | Identify what crosses a boundary
TAKEAWAYS: Hardware rings separate user code from the kernel | Administrative rights are an OS policy layer above ordinary users | MAC and integrity controls add further gates
PRACTICE: In your own VM, compare a process's identity and access checks as a standard user, an elevated administrator, and root, recording which operations succeed.
SOURCES: None
---
## Core idea
Security depends on layers of authority. At the base, CPU rings separate untrusted user code from the kernel, enforced by hardware. Above that, the operating system defines an administrative layer: root on Linux, elevated administrators on Windows. Above or alongside these sit policy layers such as SELinux/AppArmor and Windows integrity levels, which constrain even privileged principals. The mental model: crossing a layer requires passing a specific gate, and each gate is enforced by a different mechanism — a syscall instruction for the kernel boundary, sudo or UAC for the administrative boundary, and policy evaluation for MAC. Confusing the layers causes incorrect conclusions, such as believing root equals kernel mode or that UAC protects a user from themselves. In your lab, the goal is to observe these layers directly, never to attack systems you do not own.

## Method
1. Classify each boundary as hardware, OS policy, or discretionary policy.
2. Identify the credential or token that represents authority at each layer.
3. Determine the legitimate gate that crosses the boundary.
4. Observe what changes after crossing, such as token contents or effective UID.
5. Confirm which higher layer still constrains the new context.

## Example (lab only)
```bash
id
sudo id
cat /proc/self/status | grep -E 'Uid|CapEff'
```
On Windows in your own VM: `whoami /groups` before and after an elevated launch.

| Boundary | Enforced by | Gate |
|----------|-------------|------|
| User to kernel | CPU hardware | System call |
| User to admin | OS policy | sudo / UAC |
| Admin to constrained | MAC / integrity | Policy evaluation |

## Common mistakes
Treating root or Administrator as equivalent to kernel code. Assuming administrative rights bypass mandatory policy. Ignoring that a service account may be more privileged than an interactive user.

## Defense / verification
Verify boundaries with identity and policy inspection tools rather than assumptions. In your lab, document each layer's effective state and confirm that higher layers still apply after elevation.

## Knowledge check
**Q:** Which mechanism enforces the user-to-kernel boundary?
**A:** CPU hardware privilege rings, crossed only through controlled system calls.

===MODULE===
TITLE: Sandbox Concepts: Namespaces, cgroups, and Containers
LEVEL: Advanced
MINUTES: 45
SUMMARY: Understand how sandboxes narrow a program's view and resources, and where their limits lie as security boundaries.
OBJECTIVES: Compose isolation primitives into a sandbox model | Explain container isolation limits | Verify sandbox restrictions in a lab
TAKEAWAYS: Sandboxes narrow views and capabilities without a separate kernel | Containers combine namespaces, cgroups, and seccomp | A kernel flaw can escape any user-space sandbox
PRACTICE: In your own isolated VM, run an untrusted test program inside a container with a dropped capability set and confirm it cannot see host processes.
SOURCES: None
---
## Core idea
A sandbox constrains a program's view of the system and the resources it can consume, without giving it a separate machine. On Linux, this is assembled from namespaces that hide parts of the system, cgroups that limit CPU, memory, and process counts, seccomp filters that restrict syscalls, and capability sets that remove privileged operations. Containers package these mechanisms into a portable unit, while browser and application sandboxes apply similar ideas with lower and integrity levels on Windows. The mental model: isolation is a composed set of narrowed views and limits, all still reliant on a shared kernel. That shared dependency defines the limit: a kernel vulnerability can break out of a sandbox, which is why sandboxing complements rather than replaces patching. All experiments here belong in your own isolated lab.

## Method
1. Define what the untrusted code legitimately needs.
2. Select namespaces to hide unnecessary views.
3. Add cgroup limits for resource exhaustion protection.
4. Apply a seccomp allowlist and drop unneeded capabilities.
5. Verify restrictions from inside the sandbox and monitor escapes.

## Example (lab only)
```bash
docker run --rm --cap-drop=ALL --security-opt no-new-privileges <LAB_IMAGE> sh -c 'ps aux; cat /proc/self/status'
cat /sys/fs/cgroup/memory.max
```

| Layer | Restricts |
|-------|-----------|
| Namespaces | Visible processes, mounts, network |
| cgroups | Resource consumption |
| seccomp | Available syscalls |
| Capabilities | Privileged operations |

## Common mistakes
Running containers with `--privileged` or host mounts, collapsing the boundary. Assuming a sandbox protects against a compromised kernel. Giving a sandbox writable access to sensitive host paths.

## Defense / verification
Verify `no-new-privileges`, dropped capabilities, and read-only filesystems in your lab. Keep the kernel patched and avoid privileged containers in shared environments.

## Knowledge check
**Q:** Why is a container not equivalent to a virtual machine as a security boundary?
**A:** Containers share the host kernel, so a kernel flaw can escape; a VM has its own kernel.

===MODULE===
TITLE: Designing an Isolated Practice Lab
LEVEL: Intermediate
MINUTES: 35
SUMMARY: Build a safe, disposable environment for all hands-on work with clear boundaries and reliable snapshots.
OBJECTIVES: Design network isolation for lab VMs | Use snapshots for repeatability | Separate lab identity and credentials
TAKEAWAYS: Lab systems must be owned or explicitly in scope | Isolated networking prevents accidental impact on real networks | Snapshots enable fast, safe rollback
PRACTICE: In your own VM platform, create a host-only lab network, install two VMs, take a clean snapshot, and verify they cannot reach your production network.
SOURCES: None
---
## Core idea
Every practical exercise in this curriculum assumes an environment you own or an engagement with explicit written scope. A well-designed lab makes that boundary concrete. Use a hypervisor such as VirtualBox, VMware, or Hyper-V with a host-only or internal network so lab VMs cannot route to the internet or your real network. Keep separate credentials for lab accounts, never reuse production passwords or keys, and avoid joining lab machines to a real domain. Take a snapshot of each clean installation before experiments and restore it afterward, producing repeatable results. The mental model: the lab is a contained stage where mistakes are cheap and reversible, and隔离 is enforced by network design as much as by policy. Good labs also keep notes, so each experiment can be reproduced and reviewed.

## Method
1. Define the scope and list the systems you own for practice.
2. Configure an isolated network mode with no production bridge.
3. Install VMs and apply a baseline patch level.
4. Create labeled snapshots at known-good states.
5. Verify network isolation with a connection test before experimenting.

## Example (lab only)
```bash
ip addr show
ip route
ping -c 1 <LAB_ISOLATED_PEER>
```
On the host, confirm the adapter is host-only and that no bridge to the production network exists.

| Control | Purpose |
|---------|---------|
| Host-only network | Blocks external access |
| Snapshots | Fast rollback |
| Separate credentials | Prevents credential reuse |
| Notes | Reproducibility |

## Common mistakes
Bridging lab VMs onto a real network. Reusing production credentials in the lab. Forgetting to snapshot before a risky change, losing the known-good state.

## Defense / verification
Test isolation explicitly by attempting to reach an external address from the lab network and confirming failure. Verify snapshots exist and can be restored before any experiment.

## Knowledge check
**Q:** Which virtual network mode best prevents lab VMs from reaching a production network?
**A:** Host-only or internal networking without a bridged adapter.

===MODULE===
TITLE: Cross-OS Security Model Comparison
LEVEL: Advanced
MINUTES: 45
SUMMARY: Compare Linux and Windows authorization models side by side to build a portable mental model of access control.
OBJECTIVES: Map equivalent concepts across both systems | Explain structural differences | Choose the right inspection tool
TAKEAWAYS: Both systems use identity plus policy to decide access | Linux centers on UIDs, mode bits, and capabilities; Windows on SIDs, tokens, and ACLs | MAC and integrity add independent constraints on both
PRACTICE: In your own two-VM lab, grant a user access to a file on each OS and document the equivalent objects and tools used.
SOURCES: None
---
## Core idea
Linux and Windows express similar ideas with different structures. Linux identifies principals by numeric UID/GID and attaches a compact mode or an ACL to objects; Windows identifies principals by SIDs carried in tokens and attaches richer DACLs to securable objects. Linux elevation commonly uses SUID, capabilities, or sudo; Windows uses elevated tokens, UAC, and privileges. Logging is structured through journald and auditd on Linux, and through Event Logs and Sysmon on Windows. Both platforms add mandatory layers: SELinux or AppArmor on Linux, integrity levels and Credential Guard on Windows. The mental model: the concepts transfer, but the mechanisms and inspection commands do not, so fluency means knowing both the abstraction and its platform-specific expression. A comparison table is the most efficient way to consolidate this.

## Method
1. Start from the abstract question: who is asking, what do they want, and what policy applies?
2. Map each side's representation of identity.
3. Map the object's access control structure.
4. Identify the elevation mechanism and its gate.
5. Map where evidence of the decision is recorded.

## Example (lab only)
```bash
id; stat <LAB_FILE>; getfacl <LAB_FILE>
```
On your own Windows VM: `whoami /all` and `icacls <LAB_FILE>`.

| Concept | Linux | Windows |
|---------|-------|---------|
| Principal | UID / GID | SID in token |
| Object policy | Mode / ACL / capability | DACL / SACL |
| Elevation | sudo, SUID, capabilities | UAC, privileges |
| Audit | auditd, journald | Event Log, Sysmon |

## Common mistakes
Assuming feature parity — integrity levels and capabilities are not identical. Applying Linux path assumptions to Windows registry objects. Forgetting that both platforms support DAC and MAC layers.

## Defense / verification
Practice translating an access question into each platform's tools and verify with concrete inspection commands. In your lab, document both sides of each scenario.

## Knowledge check
**Q:** What is the Linux analogue of a Windows access token's identity component?
**A:** The process's UID and GID set (and capabilities), analogous to the SIDs in a Windows token.

===MODULE===
TITLE: Privilege Escalation Paths and Their Mitigations
LEVEL: Advanced
MINUTES: 50
SUMMARY: Catalog common classes of privilege escalation in authorized lab terms and pair each with a concrete defensive control.
OBJECTIVES: Categorize escalation paths | Map each class to a mitigation | Verify a mitigation in a lab
TAKEAWAYS: Escalation usually exploits overly broad trust, not exotic techniques | Misconfiguration is a dominant cause | Each path has a corresponding configuration or design control
PRACTICE: In your own VM, intentionally create a misconfigured writable service binary, observe why it is risky, then correct the ACL and verify the fix.
SOURCES: None
---
## Core idea
Within authorized practice, it is useful to study how privilege boundaries fail so they can be defended. Most escalation paths reduce to a small set of causes: excessive privilege grants, writable trusted configuration or code, credential exposure, and unpatched kernel or application flaws. On Linux, this includes world-writable services, unexpected SUID binaries, broad sudo rules, and weak file permissions. On Windows, it includes over-privileged service accounts, writable service or task binaries, exposed credentials in memory or configuration, and excessive token privileges. The mental model: escalation is found at the seam where a trusted mechanism trusts something an attacker can influence. Defenses remove that influence or narrow the trust. All testing must occur in owned VMs or explicitly in-scope engagements; never against third-party systems.

## Method
1. Inventory trust relationships that cross privilege layers.
2. For each, ask whether a lower-privileged principal can influence it.
3. Classify the weakness by cause: grant, writable artifact, credential, or patch level.
4. Apply the narrowest corrective control.
5. Verify the correction by repeating the observation in your lab.

## Example (lab only)
```bash
find / -xdev -perm -0002 -type f 2>/dev/null | head
find / -xdev -perm -4000 -type f 2>/dev/null | sort
sudo -l -U <LAB_USER>
```
On Windows in your own VM: `icacls <LAB_SERVICE_BINARY>` and `whoami /priv`.

| Cause | Mitigation |
|-------|------------|
| Broad grants | Least privilege rules |
| Writable trusted files | Restrict ACLs |
| Credential exposure | Credential Guard, LAPS |
| Unpatched flaws | Patch management |

## Common mistakes
Focusing on exotic techniques while ignoring basic misconfiguration. Testing outside owned or in-scope systems. Fixing a symptom without correcting the underlying trust relationship.

## Defense / verification
Build a repeatable audit checklist from the categories above and verify each control with commands. In your lab, confirm that a corrected ACL or rule actually blocks the previously observed behavior.

## Knowledge check
**Q:** What single question best identifies an escalation path?
**A:** Can a lower-privileged principal influence something a higher-privileged process trusts?

===MODULE===
TITLE: Least Privilege and Separation of Duties in Practice
LEVEL: Advanced
MINUTES: 40
SUMMARY: Turn the principle of least privilege into concrete account, service, and administrative design decisions.
OBJECTIVES: Apply least privilege to users and services | Explain separation of duties | Design just-in-time administration
TAKEAWAYS: Every principal should hold only the rights needed for its function | Separation of duties prevents one identity from completing a sensitive workflow alone | Just-in-time elevation limits standing privilege
PRACTICE: In your own VM, create a dedicated low-privilege service account for a test service and verify it can read only what it needs.
SOURCES: None
---
## Core idea
Least privilege means each user, service, and process holds only the permissions required for its legitimate function, and only for as long as needed. Separation of duties splits a sensitive workflow so that no single identity can complete it alone, such as requiring one account to prepare a change and another to approve it. Just-in-time administration removes standing administrative rights and grants time-limited elevation when a task is approved. The mental model: privilege is a liability to be minimized in both scope and duration. On Linux this means narrow sudo rules, dedicated service users, systemd sandboxing, and restricted capabilities; on Windows it means standard-user daily accounts, least-privileged service accounts, Windows LAPS, and protected administrative groups. Designing for least privilege reduces the blast radius of any single compromise.

## Method
1. Inventory principals and the rights each currently holds.
2. Define the minimum rights each needs for its function.
3. Remove standing privileges and introduce time-limited elevation.
4. Split sensitive workflows across distinct identities.
5. Verify that legitimate tasks still work and that excess rights are gone.

## Example (lab only)
```bash
sudo useradd -r -s /usr/sbin/nologin <LAB_SVC>
sudo setfacl -m u:<LAB_SVC>:r <LAB_DATA>
sudo -l -U <LAB_SVC>
```
On Windows in your own VM: create a dedicated service account and grant it only the required folder right.

| Practice | Effect |
|----------|--------|
| Dedicated service identity | Limits blast radius |
| Time-limited elevation | Removes standing admin |
| Split approval | Prevents single-actor abuse |
| Narrow sudo / ACL rules | Reduces granted scope |

## Common mistakes
Granting broad rights to avoid troubleshooting effort. Reusing one privileged account across many services. Assuming least privilege is a one-time task rather than continuous maintenance.

## Defense / verification
Review privileges quarterly and after role changes. In your lab, verify a service succeeds with its reduced rights and that unused permissions are actually denied.

## Knowledge check
**Q:** What is the difference between least privilege and separation of duties?
**A:** Least privilege minimizes one identity's rights; separation of duties splits a workflow so no single identity can complete it alone.

===MODULE===
TITLE: Linux Hardening Baseline with Verification
LEVEL: Advanced
MINUTES: 50
SUMMARY: Assemble a repeatable Linux hardening baseline and verify every control with concrete inspection commands.
OBJECTIVES: Define a baseline of Linux security controls | Apply each with a verification command | Detect drift from the baseline
TAKEAWAYS: Hardening is a set of verifiable settings, not a checklist to assume | Key areas are updates, identity, SSH, permissions, logging, and Mandatory Access Control | Verification commands close the loop
PRACTICE: In your own VM, apply a baseline covering SSH, sudo, umask, mounts, and logging, then run each verification command and record the results.
SOURCES: None
---
## Core idea
A hardening baseline is a documented, repeatable set of security settings with a verification command for each. For Linux, useful areas include timely patching, a restrictive umask, strong SSH configuration, minimal sudo rules, no unexpected SUID or world-writable files, hardened writable mounts, enabled and persistent logging, and active Mandatory Access Control. The mental model: a control that cannot be verified is only a hope, so every baseline item pairs a setting with an inspection command. Baselines also support drift detection: rerunning the same commands over time reveals unauthorized changes. This synthesis module connects the earlier Linux modules into an operational workflow suitable for your own lab systems, never for unattended changes on systems you do not own.

## Method
1. Document the intended value for each control.
2. Apply the setting using configuration management or careful manual edits.
3. Run the matching verification command and capture output.
4. Schedule periodic re-verification and compare against the recorded baseline.
5. Investigate and remediate every deviation before accepting it.

## Example (lab only)
```bash
sudo auditctl -l
find / -xdev -perm -4000 -type f 2>/dev/null | sort
sudo sshd -T | grep -E 'permitrootlogin|passwordauthentication'
findmnt -o TARGET,OPTIONS | grep -E '/tmp|/home'
sudo systemctl is-active auditd
```

| Control | Verification |
|---------|--------------|
| SSH hardening | `sshd -T` |
| SUID audit | `find -perm -4000` |
| Mount options | `findmnt` |
| Logging | `systemctl is-active auditd` |

## Common mistakes
Applying settings without recording expected values. Verifying only once rather than continuously. Assuming a hardening guide fits every workload without testing.

## Defense / verification
Store baseline output centrally and alert on differences. In your lab, deliberately drift one setting and confirm your verification process detects it.

## Knowledge check
**Q:** Why must every baseline control have a verification command?
**A:** Without verification you cannot confirm the setting is active or detect later drift.

===MODULE===
TITLE: Windows Hardening Baseline with Verification
LEVEL: Advanced
MINUTES: 50
SUMMARY: Assemble a Windows hardening baseline and verify identity, ACL, logging, and endpoint protections with commands.
OBJECTIVES: Define a baseline of Windows security controls | Apply settings with verification | Detect drift over time
TAKEAWAYS: Baselines cover accounts, privileges, ACLs, logging, and endpoint protection | Each control needs a verification command | Local and domain policy must both be considered
PRACTICE: In your own Windows VM, apply a baseline covering local admin membership, LSA protection, audit policy, and Defender, then verify each with a command.
SOURCES: None
---
## Core idea
A Windows hardening baseline translates earlier modules into a verifiable operational standard. Key areas include a small Administrators group, standard-user daily accounts, LSA protection and Credential Guard where supported, restricted ACLs on service and task binaries, process creation auditing with command lines, Event Log and Sysmon collection, PowerShell logging, and Defender with ASR and exploit protection. The mental model mirrors the Linux case: pair every setting with a command that proves it is active, and keep a recorded output to detect drift. Domain-joined systems require checking effective policy, not just local settings, because Group Policy can override local configuration. This synthesis is intended for systems you own or are explicitly authorized to manage.

## Method
1. Record the intended value for each control.
2. Apply settings through the appropriate local or domain policy mechanism.
3. Verify with the matching PowerShell or command-line query.
4. Confirm events are generated for audited activities.
5. Re-verify periodically and investigate deviations.

## Example (lab only)
```powershell
Get-LocalGroupMember -Group 'Administrators'
Get-ItemProperty 'HKLM:\SYSTEM\CurrentControlSet\Control\Lsa' | Select RunAsPPL
auditpol /get /category:* | Select-String 'Process Creation'
Get-MpComputerStatus | Select RealTimeProtectionEnabled,AntivirusEnabled
```

| Control | Verification |
|---------|--------------|
| Admin membership | `Get-LocalGroupMember` |
| LSA protection | `RunAsPPL` query |
| Audit policy | `auditpol /get` |
| Defender | `Get-MpComputerStatus` |

## Common mistakes
Checking local settings while domain policy overrides them. Enabling audit policy without confirming events are collected. Assuming Defender is active when it was disabled by another product.

## Defense / verification
Store baseline outputs and compare over time. In your lab, confirm that a tested control produces the expected verification result and that drift is visible.

## Knowledge check
**Q:** Why is checking effective policy important on a domain-joined Windows host?
**A:** Because Group Policy can override local settings, so only the effective configuration reflects reality.

===MODULE===
TITLE: Capstone: Authorized Cross-Platform Assessment
LEVEL: Advanced
MINUTES: 60
SUMMARY: Integrate the full curriculum by performing a structured security assessment of two owned lab VMs and reporting findings.
OBJECTIVES: Scope an authorized assessment | Collect evidence on both platforms | Produce actionable findings with verification
TAKEAWAYS: Scope and authorization precede all technical work | Evidence must be reproducible and tied to controls | Findings pair a risk with a concrete, verifiable fix
PRACTICE: In your own isolated lab, assess one Linux and one Windows VM against their baselines, then write a short report with evidence, risk, and remediation for each finding.
SOURCES: None
---
## Core idea
The capstone consolidates the entire path into a realistic workflow performed strictly within an owned, isolated lab or an explicitly in-scope engagement. Begin with a written scope stating which systems are permitted and what activities are allowed. Assess each system against its baseline using the verification commands learned earlier, collecting evidence such as command output, configuration values, and log excerpts. Classify each deviation by cause and risk, then propose the narrowest remediation and a verification step that proves it worked. The mental model: security work is a closed loop of scope, evidence, analysis, remediation, and verification. A good report lets a reader reproduce every finding and confirm every fix, which is why precise commands and outputs matter more than narrative claims.

## Method
1. Write and confirm the scope and rules of engagement.
2. Capture each system's baseline state with verification commands.
3. Compare against expected values and list deviations.
4. For each deviation, record evidence, impact, and a concrete fix.
5. Apply fixes in the lab, re-verify, and document the result.

## Example (lab only)
```bash
sudo sshd -T | grep -E 'permitrootlogin|passwordauthentication'
find / -xdev -perm -4000 -type f 2>/dev/null | sort
```
On Windows in your own VM: `whoami /groups`, `icacls <LAB_PATH>`, and `Get-MpComputerStatus`.

| Report section | Contents |
|----------------|----------|
| Scope | Authorized systems and limits |
| Evidence | Commands and outputs |
| Finding | Deviation and risk |
| Remediation | Fix and verification |

## Common mistakes
Beginning technical work before scope is explicit. Reporting assumptions without reproducible evidence. Proposing remediations that cannot be verified.

## Defense / verification
Every finding must include a verification command that can be rerun after remediation. In your lab, confirm all findings close successfully before declaring the assessment complete.

## Knowledge check
**Q:** What must accompany each finding so remediation can be proven?
**A:** A reproducible verification command and its expected result after the fix.

===MODULE===
TITLE: Mastery Checklist and Continued Practice
LEVEL: Intermediate
MINUTES: 30
SUMMARY: Consolidate the full zero-to-expert path into a self-assessment checklist and a plan for deliberate continued practice.
OBJECTIVES: Self-assess coverage of all curriculum areas | Identify weak spots | Build a sustainable practice routine
TAKEAWAYS: Mastery means explaining mechanisms, not memorizing commands | Regular verification and labs build durable skill | Ethical scope is a permanent requirement
PRACTICE: In your own VM, run through the checklist, mark each item you can explain and demonstrate, then schedule a recurring lab to retest the weakest three.
SOURCES: None
---
## Core idea
Mastery is demonstrated by explanation and reproduction, not by recalling command syntax. This final module consolidates the arc: hardware and memory fundamentals; Linux identity, permissions, processes, logging, and MAC; Windows identity, tokens, ACLs, services, logging, and endpoint protection; sandbox concepts and cross-OS comparison; and verifiable hardening baselines. The mental model is a layered one: you should be able to trace any access decision from the hardware boundary up through identity, policy, and audit. Use the checklist to find gaps, then close them with short, focused labs in your own isolated environment. Continued practice should be deliberate: pick a weak area, run a repeatable exercise, verify the result, and record what you learned. Ethical scope — owned systems or explicit written authorization — remains mandatory for every exercise.

## Method
1. Review each checklist area and rate your confidence honestly.
2. For anything you cannot explain, revisit the corresponding module.
3. Demonstrate the skill in a lab rather than relying on memory.
4. Schedule recurring short labs targeting the weakest areas.
5. Keep a lab journal of commands, results, and lessons for future review.

## Example (lab only)
```bash
id; getfacl <LAB_FILE>; systemctl status <LAB_SERVICE>
journalctl -u <LAB_SERVICE> --since '10 min ago'
```
On Windows in your own VM: `whoami /all`, `icacls <LAB_PATH>`, `Get-WinEvent`.

| Area | Self-check |
|------|------------|
| Fundamentals | Can I explain rings, paging, and tokens? |
| Linux | Can I verify permissions, sudo, and MAC? |
| Windows | Can I interpret ACLs, tokens, and events? |
| Practice | Do I verify every control and respect scope? |

## Common mistakes
Treating familiarity with commands as understanding. Skipping verification after changes. Practicing outside owned or authorized systems.

## Defense / verification
Use the checklist as a recurring audit of your own skill and confirm each item with a hands-on demonstration. Revisit this file periodically and re-run labs to maintain fluency.

## Knowledge check
**Q:** What distinguishes mastery from familiarity in this curriculum?
**A:** The ability to explain mechanisms and reproduce results with verification, not merely recall commands.
