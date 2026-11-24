===MODULE===
TITLE: Bits, Bytes, and Binary Foundations
LEVEL: Beginner
MINUTES: 25
SUMMARY: Build the numeric foundation every network concept rests on: bits, octets, binary, decimal, and hexadecimal. Learn to convert between them fluently.
OBJECTIVES: Convert between binary, decimal, and hex | Explain why octets and powers of two matter | Avoid unit-conversion errors
TAKEAWAYS: A byte is eight bits and an IPv4 address is four octets | Hex is compact binary | Networking uses powers of ten for line rates
PRACTICE: On your own lab host, pick five random octets and verify each binary, decimal, and hex form with command-line tools.
SOURCES: None
---
## Core idea
Everything on a network is ultimately bits. A bit is one binary digit, 0 or 1; eight bits form a byte (octet). Network engineers count in powers of two, so fluency in binary, decimal, and hexadecimal conversion underpins addresses, masks, and every protocol field. The mental model: a protocol field is a fixed-width row of bits, and interpreting a packet means knowing which bit positions carry which meaning.

## Method
1. Memorize the positional values of a byte: 128, 64, 32, 16, 8, 4, 2, 1.
2. Convert binary to decimal by summing place values where the bit is 1, and decimal to binary by repeated subtraction.
3. Group four bits into a nibble and map each nibble to one hex digit (0-9, A-F) for compact notation.
4. Track units carefully: memory uses powers of two (1024), while network line rates use powers of ten (1000).

## Example
On your lab host, convert values and inspect a byte:
```bash
echo "obase=2; 192" | bc       # <LAB> -> 11000000
printf '%x\n' 192              # <LAB> -> c0
python3 -c "print(bin(192))"   # <LAB> -> 0b11000000
```

## Comparison
| Representation | Value 192 | Best for |
|---|---|---|
| Binary | 11000000 | Mask logic, bitwise ops |
| Decimal | 192 | Human-readable addresses |
| Hex | C0 | Compact packet dumps |

## Common mistakes
- Treating 1000 (10^3) as 1024 (2^10) when sizing subnets or estimating throughput.
- Reading bit positions right-to-left; the leftmost bit is the most significant.
- Assuming an IPv4 address is four arbitrary numbers rather than four octets.

## Defense / verification
Always verify conversions with a tool rather than mental math. In the lab, generate a random octet and confirm its binary, decimal, and hex forms agree before using it in a mask exercise.

## Knowledge check
Q: What is decimal 255 in binary and hex?
A: 11111111 and FF.

===MODULE===
TITLE: The OSI and TCP/IP Models
LEVEL: Beginner
MINUTES: 30
SUMMARY: Understand layered networking models and how encapsulation wraps data as it descends each layer. Map common protocols to their layers.
OBJECTIVES: Recall the OSI and TCP/IP layers | Trace encapsulation of a request | Name the PDU at each layer
TAKEAWAYS: Layers hide complexity behind interfaces | Each layer adds a header (and sometimes a trailer) | PDUs change names as they descend
PRACTICE: On your lab machine, capture one HTTP request and label each layer's header you can identify.
SOURCES: None
---
## Core idea
Layered models split the huge problem of network communication into manageable pieces. The seven-layer OSI reference model is a teaching framework; the four-layer TCP/IP model reflects the real protocol suite. The mental model is nested envelopes: as data descends, each layer wraps the layer above it in a new header (and at the link layer, a trailer). At the receiver the wrappers are removed in reverse order. Layering lets a change at one level, such as swapping Ethernet for Wi-Fi, leave the layers above untouched.

## Method
1. Memorize OSI top-to-bottom: Application, Presentation, Session, Transport, Network, Data Link, Physical.
2. Map TCP/IP onto it: Application, Transport, Network, Link (sometimes called Network Access).
3. Assign protocols to layers: HTTP and DNS at Application, TCP and UDP at Transport, IP and ICMP at Network, Ethernet at Link.
4. Trace a web request: data becomes a segment, then a packet, then a frame, then bits on the wire.

## Example
In your lab, generate and observe one exchange:
```bash
curl http://<LAB_HOST>/          # <LAB> generate one HTTP request
sudo tcpdump -i <LAB_IFACE> -c 5 # <LAB> observe the resulting frames
```

## Comparison
| OSI layer | TCP/IP layer | Example protocol |
|---|---|---|
| Application/Presentation/Session | Application | HTTP, DNS, TLS |
| Transport | Transport | TCP, UDP |
| Network | Network | IP, ICMP |
| Data Link/Physical | Link | Ethernet, ARP |

## Common mistakes
- Treating OSI as a literal implementation; it is a conceptual guide, not a mandated stack.
- Confusing the session and presentation layers with real protocols.
- Forgetting that routers work at Layer 3 while switches work at Layer 2.

## Defense / verification
When troubleshooting, name the layer first, then inspect only that layer's headers. This narrows the problem quickly and prevents random restarting of services.

## Knowledge check
Q: Which PDU corresponds to the Network layer?
A: A packet (a datagram).

===MODULE===
TITLE: Frames and the Data Link Layer
LEVEL: Beginner
MINUTES: 30
SUMMARY: Learn how packets are wrapped into frames for delivery across a single physical link, including the frame header, payload, and integrity trailer.
OBJECTIVES: Identify Ethernet frame fields | Explain MTU and FCS | Distinguish a frame from a packet
TAKEAWAYS: A frame is a link-local envelope | The FCS detects corruption, not malicious tampering | Routers rewrite frames at each hop
PRACTICE: On your lab host, capture frames and display link-layer headers with tcpdump's -e flag.
SOURCES: None
---
## Core idea
The data link layer moves packets between nodes on the same physical or logical link by wrapping them in frames. The mental model: a frame is a local delivery envelope addressed to the next hop, not the final destination. It contains a header (destination MAC, source MAC, EtherType), a payload (usually an IP packet), and a trailer with a Frame Check Sequence used to detect corruption. Frames live only on one link; a router strips and rebuilds them at every hop while the IP packet stays end-to-end.

## Method
1. Identify the standard Ethernet II fields: preamble, destination MAC, source MAC, EtherType (0x0800 for IPv4), payload, FCS.
2. Learn MTU (typically 1500 bytes) and how larger IP packets are fragmented.
3. Understand that FCS is a CRC computed by hardware; corrupt frames are silently dropped.
4. Trace how a frame's MAC addresses change at each routed hop while IP addresses remain constant.

## Example
Display link-layer headers from a lab capture:
```bash
sudo tcpdump -i <LAB_IFACE> -e -c 3         # <LAB> print MAC addresses and EtherType
ip -s link show <LAB_IFACE>                 # <LAB> check RX/TX errors and drops
```

## Comparison
| Property | Frame (Layer 2) | Packet (Layer 3) |
|---|---|---|
| Address type | MAC | IP |
| Scope | Single link | End-to-end across networks |
| Integrity | FCS/CRC | Header checksum (IPv4) |

## Common mistakes
- Believing MAC addresses stay the same from source to destination; they change at every router.
- Expecting FCS to be a security control; it only detects accidental corruption.
- Ignoring MTU mismatches that cause silent fragmentation or drops.

## Defense / verification
Check interface counters for CRC and frame errors with `ip -s link`. Rising FCS errors usually indicate cabling, duplex, or physical problems rather than software bugs.

## Knowledge check
Q: What field tells a receiver which upper-layer protocol the frame carries?
A: The EtherType field (for example, 0x0800 for IPv4).

===MODULE===
TITLE: Ethernet: Frame Format, Duplex, and Autonegotiation
LEVEL: Beginner
MINUTES: 30
SUMMARY: Trace Ethernet from shared coax with CSMA/CD to modern switched full-duplex links, and read the frame format and link settings.
OBJECTIVES: Contrast legacy and modern Ethernet | Explain CSMA/CD and duplex | Inspect negotiated link parameters
TAKEAWAYS: Modern switched Ethernet is full-duplex and collision-free | Autonegotiation sets speed and duplex | Ethernet II is the dominant frame format
PRACTICE: On your lab NIC, use ethtool to inspect speed, duplex, and negotiated settings.
SOURCES: None
---
## Core idea
Ethernet began as a shared bus where every station competed for the wire using CSMA/CD. Switched Ethernet removed contention by giving each device a dedicated link, making full-duplex the norm. The mental model: legacy Ethernet was a noisy room where devices waited for silence; a modern switch is a set of private phone lines. Two frame formats exist: Ethernet II (with EtherType) is standard for IP traffic, while IEEE 802.3 uses a length field and LLC/SNAP. Autonegotiation lets a link pick the highest common speed and duplex.

## Method
1. Recall the CSMA/CD steps: carrier sense, transmit, detect collision, back off randomly, retry.
2. Contrast half-duplex (shared, collisions possible) with full-duplex (separate transmit and receive paths).
3. Parse an Ethernet II header: destination MAC, source MAC, EtherType, payload, FCS.
4. Inspect negotiated link settings and counters on a lab interface.

## Example
Inspect your lab interface:
```bash
ethtool <LAB_IFACE>        # <LAB> speed, duplex, autonegotiation state
ethtool -S <LAB_IFACE>     # <LAB> per-interface statistics and errors
```

## Comparison
| Mode | Collisions | Typical use |
|---|---|---|
| Half-duplex shared | Possible | Legacy hubs, obsolete |
| Full-duplex switched | None | All modern access links |

## Common mistakes
- Forcing speed and duplex on one side only, creating a duplex mismatch with late collisions and CRC errors.
- Assuming collisions still occur on a modern switched network.
- Confusing the 802.3 length field with an EtherType value.

## Defense / verification
Prefer autonegotiation on both ends; hard-code only when debugging and set both sides identically. Verify with ethtool that Speed, Duplex, and Auto-negotiation match expectations.

## Knowledge check
Q: Why can full-duplex Ethernet not have collisions?
A: Separate transmit and receive paths remove contention; each endpoint has a dedicated link to the switch.

===MODULE===
TITLE: MAC Addresses: Structure and Addressing
LEVEL: Beginner
MINUTES: 25
SUMMARY: Decode the 48-bit MAC address, its OUI and device-specific portions, and the unicast, multicast, and broadcast address types.
OBJECTIVES: Parse a MAC address into OUI and node ID | Identify unicast, multicast, and broadcast | Recognize locally administered addresses
TAKEAWAYS: MAC addresses are 48 bits shown as six hex pairs | The I/G bit marks group addresses | Broadcast is FF:FF:FF:FF:FF:FF
PRACTICE: On your lab host, list interface MACs and decode the OUI and locally administered bit for each.
SOURCES: None
---
## Core idea
A MAC address is a 48-bit identifier written as six colon-separated hex pairs. The first 24 bits are the OUI assigned to a vendor; the last 24 bits are assigned by that vendor. The least significant bit of the first octet is the Individual/Group bit: 0 means unicast, 1 means multicast. The next bit marks locally administered versus universally administered addresses. The mental model: MAC addresses are local names that only matter on the current link, unlike IP addresses which are globally meaningful. Broadcast uses all-ones (FF:FF:FF:FF:FF:FF).

## Method
1. Split a MAC into its OUI (first three octets) and node identifier (last three octets).
2. Read the first octet in binary to determine unicast/multicast and global/local scope.
3. Recognize special addresses: broadcast all-ones, IPv4 multicast starting 01:00:5E, IPv6 multicast starting 33:33.
4. Note that OSes often randomize MACs for privacy on wireless networks.

## Example
Inspect and decode lab interface addresses:
```bash
ip link show <LAB_IFACE>                 # <LAB> view link-layer address
echo "0x$(echo 02 | sed 's/./&/g')"      # <LAB> inspect the first octet bits
```

## Comparison
| Address type | I/G bit | Example | Reach |
|---|---|---|---|
| Unicast | 0 | 00:1A:2B:3C:4D:5E | One NIC |
| Multicast | 1 | 01:00:5E:00:00:01 | Group of NICs |
| Broadcast | all ones | FF:FF:FF:FF:FF:FF | All NICs on link |

## Common mistakes
- Assuming a burned-in address is permanent; software can override it.
- Treating multicast as broadcast; only subscribed NICs accept multicast frames.
- Reading the OUI as proof of device type; addresses can be spoofed or randomized in a lab.

## Defense / verification
Use `ip link` to confirm the active MAC rather than trusting documentation. On managed switches, port-security features bind expected MACs to ports.

## Knowledge check
Q: What does a first octet of 02 indicate?
A: Locally administered, unicast (the second-least-significant bit is set, the I/G bit is clear).

===MODULE===
TITLE: ARP: Resolving IPv4 Addresses to MAC Addresses
LEVEL: Beginner
MINUTES: 35
SUMMARY: Learn how ARP maps a next-hop IPv4 address to a MAC address on the local link using a broadcast request and unicast reply.
OBJECTIVES: Explain the ARP request/reply flow | Inspect the ARP cache | State ARP's local-link limitation
TAKEAWAYS: ARP asks "who has this IP?" by broadcast | The reply is unicast | ARP only works on the local broadcast domain
PRACTICE: In your lab, clear and repopulate the ARP cache while capturing ARP traffic.
SOURCES: None
---
## Core idea
Before an IPv4 host can send a frame, it needs the MAC address of the next hop. ARP provides that mapping. The mental model: a host shouts a question to the whole local network — "who has IP 192.168.1.1? Tell 192.168.1.10" — and the owner answers privately. The request is a broadcast frame; the reply is unicast. Results are cached for a limited time so the exchange is not repeated for every packet. Crucially, ARP is confined to the local broadcast domain; a router answers ARP on behalf of remote destinations.

## Method
1. Check the local ARP/neighbor cache for the desired IP.
2. If absent, build a broadcast ARP request with target protocol address and blank target hardware address.
3. The owner fills in its MAC and sends a unicast ARP reply.
4. Cache the mapping with a timer and then send the queued IP packet.

## Example
Observe ARP in a lab segment:
```bash
ip neigh show <LAB_GATEWAY>       # <LAB> inspect neighbor (ARP) cache
sudo ip neigh flush dev <LAB_IFACE> # <LAB> clear cache to force a new exchange
sudo tcpdump -i <LAB_IFACE> arp -c 4 # <LAB> capture request and reply
```

## Comparison
| Message | Destination | Purpose |
|---|---|---|
| ARP request | Broadcast FF:FF:... | Find owner of an IP |
| ARP reply | Unicast to requester | Provide MAC mapping |

## Common mistakes
- Thinking ARP resolves remote IPs directly; it always resolves the next-hop gateway on the local link.
- Assuming ARP is authenticated; in a lab, spoofed replies can poison a cache, which is why dynamic ARP inspection exists.
- Forgetting cache entries expire, so stale mappings can briefly break connectivity.

## Defense / verification
Verify mappings with `ip neigh show` and compare against known gateway MACs. On managed switches, enable dynamic ARP inspection and DHCP snooping in production.

## Knowledge check
Q: Why is the ARP request a broadcast but the reply unicast?
A: The requester does not know the target MAC, so it must ask everyone; the target learns the requester's MAC from the request and can answer directly.

===MODULE===
TITLE: Switching: MAC Learning and Forwarding
LEVEL: Intermediate
MINUTES: 35
SUMMARY: Discover how a switch learns MAC-to-port mappings, forwards frames intelligently, and floods unknown destinations and broadcasts.
OBJECTIVES: Describe MAC learning and aging | Explain forwarding, filtering, and flooding | Understand loop risks and STP
TAKEAWAYS: Switches build a MAC address table from source addresses | Unknown unicast is flooded | Loops require Spanning Tree
PRACTICE: In a lab with two hosts and a switch (or Linux bridge), watch the MAC table populate as hosts communicate.
SOURCES: None
---
## Core idea
A switch is a transparent Layer 2 device that connects hosts within one broadcast domain. The mental model: the switch is a receptionist who learns which desk each person sits at by watching who speaks, then delivers letters directly to the correct desk. It learns by recording the source MAC of every incoming frame against the ingress port. Known destination MACs are forwarded only out the learned port; unknown unicast, multicast, and broadcast are flooded out all other ports in the VLAN. Redundant links create loops, so Spanning Tree Protocol blocks paths.

## Method
1. Learn: on frame arrival, record source MAC and ingress port in the CAM/MAC table with a timer.
2. Forward: if the destination MAC is known on another port, send only there; if on the same port, filter it.
3. Flood: if the destination is unknown or broadcast, send to all other ports in the same VLAN.
4. Age out stale entries and run STP to prevent loops in redundant topologies.

## Example
Inspect a lab switch or Linux bridge table:
```bash
brctl showmacs <LAB_BRIDGE>        # <LAB> list learned MAC/port pairs
ip link show <LAB_BRIDGE>          # <LAB> confirm bridge state
```

## Comparison
| Device | Collision domains | Broadcast domains |
|---|---|---|
| Hub | One | One |
| Switch | One per port | One per VLAN |
| Router | One per port | One per interface |

## Common mistakes
- Believing a switch separates broadcast domains; only VLANs or routers do that.
- Ignoring STP; duplicate links without it create broadcast storms.
- Assuming the MAC table is infinite; in a lab, MAC flooding can exhaust it and cause flooding.

## Defense / verification
Enable STP, port security, and storm control on managed switches. Verify learned entries with the MAC table and confirm no unexpected ports appear.

## Knowledge check
Q: What does a switch do with a frame whose destination MAC is unknown?
A: It floods the frame out every other port in the same VLAN.

===MODULE===
TITLE: VLANs, Trunking, and 802.1Q Tags
LEVEL: Intermediate
MINUTES: 40
SUMMARY: Learn how VLANs divide one physical switch into separate broadcast domains and how 802.1Q tags carry VLAN identity across trunks.
OBJECTIVES: Explain access and trunk ports | Describe the 802.1Q tag | Avoid native VLAN and hopping mistakes
TAKEAWAYS: A VLAN is a logical broadcast domain | 802.1Q inserts a 4-byte tag with a 12-bit VLAN ID | Inter-VLAN traffic needs a router or L3 switch
PRACTICE: In your lab, create two VLANs on a managed switch or Linux bridge and verify tag isolation with captures.
SOURCES: None
---
## Core idea
A VLAN lets one physical switch behave like several independent switches. The mental model: VLANs are separate rooms inside the same building; people in different rooms cannot hear each other unless a router acts as a hallway. Access ports belong to one VLAN and carry untagged frames. Trunk ports carry multiple VLANs by inserting an 802.1Q tag containing a 12-bit VLAN ID (1-4094). The native VLAN is untagged on a trunk and must match on both ends. Traffic between VLANs requires a router-on-a-stick or a Layer 3 switch.

## Method
1. Define the VLANs and assign each access port to one.
2. Configure trunk ports to carry the required VLAN list.
3. Ensure native VLAN IDs match on both ends and consider tagging the native VLAN.
4. Verify that hosts in different VLANs cannot reach each other without routing.

## Example
Capture a tagged frame in the lab:
```bash
sudo tcpdump -i <LAB_IFACE> -e -c 3    # <LAB> look for "vlan" in link headers
ip link add link <LAB_IFACE> name <LAB_VLAN_IF> type vlan id <LAB_VID>
ip link set <LAB_VLAN_IF> up           # <LAB> create a VLAN subinterface
```

## Comparison
| Port type | Frame format | VLANs carried |
|---|---|---|
| Access | Untagged | One |
| Trunk | Tagged (except native) | Many |

## Common mistakes
- Forgetting that VLANs are Layer 2; inter-VLAN traffic still needs a router.
- Native VLAN mismatches causing traffic to land in the wrong VLAN.
- Leaving unused VLANs on trunks, which enables double-tagging VLAN hopping in a lab.

## Defense / verification
Prune trunks to only required VLANs, change the native VLAN to an unused ID, and explicitly tag it. Verify with `tcpdump -e` that tags appear as expected.

## Knowledge check
Q: How many VLAN IDs does 802.1Q support?
A: 4094 usable IDs (12 bits, with 0 and 4095 reserved).

===MODULE===
TITLE: IPv4 Address Structure and Address Classes
LEVEL: Beginner
MINUTES: 30
SUMMARY: Understand the 32-bit IPv4 address, dotted-decimal notation, the historic class system, and reserved address ranges.
OBJECTIVES: Read an IPv4 address in binary | Identify legacy class A/B/C ranges | Recognize special-purpose ranges
TAKEAWAYS: IPv4 is 32 bits written as four octets | Classes are historical but shape default masks | Private and reserved ranges are not globally routable
PRACTICE: On your lab host, list all IPv4 addresses and classify each by range and purpose.
SOURCES: None
---
## Core idea
An IPv4 address is a 32-bit number written as four decimal octets separated by dots. Historically, the leading bits determined a class that fixed the split between network and host portions: class A (/8), B (/16), and C (/24), plus multicast (D) and experimental (E). Classful addressing was replaced by CIDR, but the defaults still appear in discussions and tools. The mental model: an address has a network part that identifies the link and a host part that identifies the device on that link. Special ranges such as 127/8 loopback, 169.254/16 link-local, and RFC 1918 private space serve specific roles.

## Method
1. Convert each octet to binary to see the full 32-bit address.
2. Classify by the first octet: 1-126 A, 128-191 B, 192-223 C, 224-239 D, 240-255 E.
3. Note the default mask implied by each class (/8, /16, /24).
4. Flag reserved ranges: private (10/8, 172.16/12, 192.168/16), loopback, link-local, multicast.

## Example
List and classify lab addresses:
```bash
ip -4 addr show <LAB_IFACE>     # <LAB> show IPv4 address and prefix
python3 -c "import ipaddress; a=ipaddress.ip_address('10.0.0.1'); print(a.is_private, a.is_multicast)"
```

## Comparison
| Class | First octet | Default mask |
|---|---|---|
| A | 1-126 | /8 |
| B | 128-191 | /16 |
| C | 192-223 | /24 |
| D (multicast) | 224-239 | N/A |

## Common mistakes
- Applying class defaults when an explicit prefix length is present; CIDR always wins.
- Treating private addresses as if they were globally routable.
- Forgetting that 127.0.0.1 is loopback and never appears on the wire.

## Defense / verification
Use `ip -4 addr` to confirm the actual prefix instead of guessing from the class. Cross-check unusual addresses with Python's `ipaddress` module.

## Knowledge check
Q: What is the default mask of a class B address?
A: /16, or 255.255.0.0.

===MODULE===
TITLE: Subnet Masks and the Binary AND Operation
LEVEL: Beginner
MINUTES: 35
SUMMARY: Learn how a subnet mask separates network from host bits and how a bitwise AND yields the network address for any IP.
OBJECTIVES: Convert a prefix length to a mask | Compute a network address with AND | Derive broadcast and usable range
TAKEAWAYS: A mask is a run of 1s followed by 0s | IP AND mask gives the network address | Prefix length counts the 1 bits
PRACTICE: In your lab, take three host addresses and compute network, broadcast, and usable host ranges by hand, then verify with ipcalc.
SOURCES: None
---
## Core idea
A subnet mask is a 32-bit pattern of consecutive 1s followed by 0s. The 1s mark network bits and the 0s mark host bits. Performing a bitwise AND between an IP address and its mask yields the network address, which identifies the subnet. The mental model: the mask is a stencil that hides the host portion, leaving only the street name (network) visible. Prefix notation like /26 is shorthand for a mask with 26 leading ones. From the network address and host-bit count you can derive the broadcast address and the usable host range.

## Method
1. Write the mask as 1s and 0s from the prefix length (for example, /26 is 26 ones then 6 zeros).
2. Align the IP address above the mask in binary.
3. AND each column: 1 only where both bits are 1.
4. Convert the result back to dotted decimal to get the network address; set all host bits to 1 for the broadcast.

## Example
Worked example on a lab-sized subnet:
```
IP:    192.168.10.130  = 11000000.10101000.00001010.10000010
Mask:  255.255.255.192 = 11111111.11111111.11111111.11000000 (/26)
AND:   192.168.10.128  = 11000000.10101000.00001010.10000000
Broadcast = 192.168.10.191 ; usable hosts = .129 - .190
```
```bash
ipcalc 192.168.10.130/26          # <LAB> verify the worked result
```

## Comparison
| Notation | Example | Meaning |
|---|---|---|
| Dotted mask | 255.255.255.192 | Same 26 network bits |
| Prefix length | /26 | Count of leading 1 bits |

## Common mistakes
- Counting usable hosts as 2^h instead of 2^h - 2 (network and broadcast are not usable).
- Misaligning octets when doing the AND by hand.
- Assuming the broadcast address is always the last address ending in 255.

## Defense / verification
Verify hand calculations with `ipcalc` or `python3 -c "import ipaddress; print(ipaddress.ip_network('192.168.10.130/26', strict=False))"` on your lab machine.

## Knowledge check
Q: What is the network address of 172.16.5.77/24?
A: 172.16.5.0.

===MODULE===
TITLE: Subnetting Worked Examples
LEVEL: Intermediate
MINUTES: 45
SUMMARY: Work through practical IPv4 subnetting problems, splitting a network into equal-sized subnets and calculating ranges by hand.
OBJECTIVES: Borrow host bits to create subnets | Compute ranges for /26 and /27 | Verify with tooling
TAKEAWAYS: Borrowing n bits creates 2^n subnets | Hosts per subnet is 2^h - 2 | The block size is 256 minus the mask's last octet
PRACTICE: In your lab, split 192.168.20.0/24 into four equal subnets and assign addresses to three test hosts, then verify reachability.
SOURCES: None
---
## Core idea
Subnetting borrows bits from the host portion of an address to create multiple smaller networks. The mental model: you start with one large street and subdivide it into blocks, each with its own network address, broadcast address, and pool of house numbers. A /24 network has 256 addresses; borrowing two host bits gives four /26 blocks of 64 addresses each (62 usable). Borrowing three gives eight /27 blocks of 32 addresses (30 usable). The block size in the last octet is the key shortcut: 256 minus the mask value.

## Method
1. Decide how many subnets you need and borrow n bits so 2^n is at least that many.
2. Compute the new prefix: original prefix plus n.
3. Find the block size: 256 - last-octet mask value (for masks within one octet).
4. List each subnet's network, first usable, last usable, and broadcast address.

## Example
Split 192.168.20.0/24 into four /26 subnets (mask 255.255.255.192, block size 64):
```
Subnet 1: 192.168.20.0/26   hosts .1   - .62   broadcast .63
Subnet 2: 192.168.20.64/26  hosts .65  - .126  broadcast .127
Subnet 3: 192.168.20.128/26 hosts .129 - .190  broadcast .191
Subnet 4: 192.168.20.192/26 hosts .193 - .254  broadcast .255
```
```bash
ipcalc -n -b 192.168.20.65/26   # <LAB> confirm network and broadcast
```

## Comparison
| Prefix | Mask | Hosts/subnet | Subnets from /24 |
|---|---|---|---|
| /25 | 255.255.255.128 | 126 | 2 |
| /26 | 255.255.255.192 | 62 | 4 |
| /27 | 255.255.255.224 | 30 | 8 |
| /28 | 255.255.255.240 | 14 | 16 |

## Common mistakes
- Assigning the network or broadcast address to a host.
- Using block size 64 but numbering subnets from .1 instead of .0.
- Forgetting that borrowed bits reduce hosts, not increase them.

## Defense / verification
Verify each range with `ipcalc` or Python's `ipaddress` module before assigning addresses. Test with `ping` between subnets in your lab to confirm the intended isolation.

## Knowledge check
Q: How many usable hosts does a /27 subnet have?
A: 30 (2^5 - 2).

===MODULE===
TITLE: CIDR and Variable-Length Subnet Masking
LEVEL: Intermediate
MINUTES: 45
SUMMARY: Learn classless inter-domain routing and VLSM, where different subnets use different prefix lengths to allocate addresses efficiently.
OBJECTIVES: Aggregate routes with CIDR | Apply VLSM to mixed-size networks | Avoid overlapping ranges
TAKEAWAYS: CIDR replaces classful masks with arbitrary prefix lengths | VLSM sizes each subnet to need | Supernetting collapses multiple networks into one route
PRACTICE: In your lab, design a VLSM plan for networks needing 50, 20, and 10 hosts from a single /24 and verify no overlaps.
SOURCES: None
---
## Core idea
CIDR describes an IP address with an explicit prefix length, removing the rigidity of classful addressing. VLSM goes further: within one major network, different subnets use different prefix lengths so each is sized to its actual host count. The mental model: instead of cutting a cake into equal slices, you cut slices of different sizes to match each guest's appetite. CIDR also enables aggregation (supernetting), where several contiguous networks are summarized into one routing-table entry, which keeps internet routing tables manageable.

## Method
1. List required host counts and sort from largest to smallest.
2. For each, choose the smallest prefix whose usable host count fits: 2^h - 2 >= needed.
3. Allocate blocks on boundary addresses so they do not overlap.
4. Where contiguous blocks share a common prefix, aggregate them into a summary route.

## Example
Allocate from 10.0.0.0/24 for needs of 50, 20, and 10 hosts:
```
50 hosts -> /26 : 10.0.0.0/26   (62 usable)
20 hosts -> /27 : 10.0.0.64/27  (30 usable)
10 hosts -> /28 : 10.0.0.96/28  (14 usable)
Unused       : 10.0.0.112/28 - 10.0.0.255
```
```bash
python3 -c "import ipaddress; print(ipaddress.collapse_addresses([ipaddress.ip_network('10.0.0.0/26'), ipaddress.ip_network('10.0.0.64/27')]))"
# <LAB> repeat the aggregation check with your own lab prefixes
```

## Comparison
| Technique | Prefixes | Main benefit |
|---|---|---|
| Classful | Fixed by class | Simple but wasteful |
| CIDR | One prefix per network | Flexible allocation |
| VLSM | Mixed prefixes in one block | Minimal wasted addresses |

## Common mistakes
- Allocating blocks that overlap because they were not aligned to their boundary.
- Choosing a prefix where 2^h - 2 is just below the host requirement.
- Summarizing non-contiguous blocks, which black-holes traffic.

## Defense / verification
Use `ipaddress.collapse_addresses` or a spreadsheet to check for overlaps before deployment. In the lab, verify each host's address and mask with `ip addr` and confirm routing between subnets.

## Knowledge check
Q: What prefix fits exactly 10 hosts with the least waste?
A: /28, which provides 14 usable addresses.

===MODULE===
TITLE: NAT and PAT: Translating Private Addresses
LEVEL: Intermediate
MINUTES: 40
SUMMARY: Understand how NAT maps private addresses to public ones and how PAT overloads many internal hosts onto a single public IP.
OBJECTIVES: Distinguish static NAT, dynamic NAT, and PAT | Explain the translation table | Identify NAT side effects
TAKEAWAYS: NAT conserves public IPv4 addresses | PAT adds a port dimension | NAT breaks end-to-end address transparency
PRACTICE: On your lab router or Linux host, configure a lab-only NAT rule and inspect the translation table while a client browses.
SOURCES: None
---
## Core idea
Network Address Translation rewrites IP addresses in packet headers as traffic crosses a boundary, typically between a private lab network and the internet. Static NAT maps one internal address to one external address; dynamic NAT draws from a pool; PAT (also called NAT overload) maps many internal addresses to one external IP using distinct source ports. The mental model: PAT is an apartment mailroom where many tenants share one street address, and the apartment number is the port that identifies the real recipient. Translation state lives in a table keyed by protocol, internal address/port, external address/port, and destination.

## Method
1. Identify inside and outside interfaces on the gateway.
2. Define which internal addresses are eligible for translation.
3. Choose static, dynamic, or PAT behavior and configure the rule.
4. Inspect the translation table and confirm return traffic is mapped back correctly.

## Example
Inspect lab NAT state on a Linux gateway:
```bash
sudo iptables -t nat -A POSTROUTING -s <LAB_LAN> -o <LAB_WAN> -j MASQUERADE
sudo conntrack -L | head          # <LAB> view active translation entries
```

## Comparison
| Type | Internal to external | Typical use |
|---|---|---|
| Static NAT | One-to-one, fixed | Lab server with a stable public mapping |
| Dynamic NAT | One-to-one from pool | Limited public addresses |
| PAT | Many-to-one with ports | Home and small-office gateways |

## Common mistakes
- Expecting inbound connections to work through PAT without an explicit port forwarding rule.
- Forgetting that some protocols embed addresses in their payloads and need application-layer gateways.
- Assuming NAT provides security; it hides addresses but is not a firewall.

## Defense / verification
Inspect the translation table with `conntrack -L` or the vendor equivalent. Keep logs of external ports if attribution is needed, and pair NAT with an actual firewall policy.

## Knowledge check
Q: What makes PAT different from dynamic NAT?
A: PAT reuses one public IP and distinguishes sessions by source port, while dynamic NAT assigns distinct public IPs from a pool.

===MODULE===
TITLE: Routing: Static Routes and Dynamic Protocols
LEVEL: Intermediate
MINUTES: 45
SUMMARY: Learn how routers choose paths from their routing tables, the longest-prefix-match rule, and the roles of static and dynamic routing.
OBJECTIVES: Read a routing table | Apply longest-prefix matching | Compare static and dynamic routing
TAKEAWAYS: A route is destination prefix plus next hop and outgoing interface | Longest prefix wins | Administrative distance breaks ties between sources
PRACTICE: In a lab with two routers, add a static route between two subnets and verify with ping and traceroute.
SOURCES: None
---
## Core idea
Routers forward packets by consulting a routing table that maps destination prefixes to next hops or outgoing interfaces. The mental model: a routing table is a set of signposts, and when several signposts could apply, the most specific one wins — the longest prefix match. Directly connected routes are most specific; a default route (0.0.0.0/0) is the least specific catch-all. Routes are learned from directly connected interfaces, static configuration, or dynamic protocols such as OSPF. Administrative distance ranks trust when the same prefix arrives from multiple sources.

## Method
1. Display the routing table and identify directly connected, static, and default routes.
2. For a destination, find all matching prefixes.
3. Select the one with the longest prefix length.
4. If ties remain between sources, use administrative distance and then the protocol's metric.

## Example
Add and verify a lab static route:
```bash
ip route show                                  # <LAB> inspect the table
sudo ip route add <LAB_REMOTE_NET> via <LAB_NEXT_HOP>
ip route get <LAB_REMOTE_HOST>                 # <LAB> see chosen route
traceroute <LAB_REMOTE_HOST>                   # <LAB> verify the path
```

## Comparison
| Route source | Administrative distance (Cisco-style) | Behavior |
|---|---|---|
| Connected | 0 | Most trusted |
| Static | 1 | Operator-defined |
| OSPF | 110 | Dynamic link-state |
| RIP | 120 | Dynamic distance-vector |

## Common mistakes
- Adding a static route pointing to a next hop that is not itself reachable.
- Expecting a default route to override a more specific route; specificity always wins first.
- Forgetting return routes, so ping succeeds one way but replies are lost.

## Defense / verification
Use `ip route get <destination>` to confirm which path the kernel chooses. In the lab, verify both directions with `traceroute` and check that only intended prefixes are advertised by dynamic protocols.

## Knowledge check
Q: Which route wins for destination 10.1.2.3 when both 10.1.0.0/16 and 10.1.2.0/24 exist?
A: 10.1.2.0/24, because it is the longer (more specific) prefix.

===MODULE===
TITLE: IPv6 Address Format and Notation
LEVEL: Beginner
MINUTES: 35
SUMMARY: Learn the 128-bit IPv6 address format, hexadecimal notation, compression rules, and prefix length conventions.
OBJECTIVES: Write IPv6 addresses in canonical form | Apply zero compression rules | Interpret prefix lengths
TAKEAWAYS: IPv6 uses eight 16-bit hexadecimal groups | Leading zeros and consecutive zero groups can be compressed | Prefix length follows a slash like /64
PRACTICE: On your lab host, expand and compress several IPv6 addresses and verify with Python's ipaddress module.
SOURCES: None
---
## Core idea
IPv6 uses 128-bit addresses, written as eight groups of four hexadecimal digits separated by colons. The mental model: where IPv4 had four small decimal boxes, IPv6 has eight larger hex boxes, giving a vast address space. Two compression rules keep addresses readable: leading zeros within a group may be dropped, and one consecutive run of all-zero groups may be replaced by a double colon (::). The double colon may appear only once, or the address would be ambiguous. Prefix length works as in IPv4: /64 is the common LAN size, leaving 64 bits for the interface identifier.

## Method
1. Split the address into eight 16-bit groups.
2. Drop leading zeros in each group (e.g., 0a3f becomes a3f).
3. Replace the longest run of zero groups with ::, once only.
4. Read the prefix length after the slash; /64 means the first 64 bits are the network portion.

## Example
Expand and compress lab addresses:
```
2001:0db8:0000:0000:0000:ff00:0042:8329
2001:db8::ff00:42:8329   (compressed, canonical)
```
```bash
python3 -c "import ipaddress; print(ipaddress.IPv6Address('2001:db8::ff00:42:8329').compressed)"
ip -6 addr show <LAB_IFACE>    # <LAB> view your host's IPv6 addresses
```

## Comparison
| Property | IPv4 | IPv6 |
|---|---|---|
| Bits | 32 | 128 |
| Notation | Decimal octets | Hex groups |
| Common LAN prefix | /24 | /64 |

## Common mistakes
- Using :: more than once in a single address.
- Dropping trailing zeros instead of leading zeros within a group.
- Assuming /64 wastes addresses; it is the intended size for SLAAC.

## Defense / verification
Let tools canonicalize addresses for you with `ipaddress.IPv6Address(...).compressed`. Copy addresses from tool output rather than retyping long hex strings to avoid typos.

## Knowledge check
Q: How many 16-bit groups does an IPv6 address contain?
A: Eight.

===MODULE===
TITLE: IPv6 Address Types and Scopes
LEVEL: Intermediate
MINUTES: 35
SUMMARY: Survey the major IPv6 address types: global unicast, link-local, multicast, anycast, loopback, and IPv4-mapped addresses.
OBJECTIVES: Identify an address type from its prefix | Explain link-local scope | Recognize EUI-64 and mapped addresses
TAKEAWAYS: Global unicast commonly begins 2000::/3 | Link-local uses fe80::/10 | Multicast begins ff00::/8
PRACTICE: On your lab host, list every IPv6 address and classify each by type and scope.
SOURCES: None
---
## Core idea
IPv6 defines several address types distinguished by their leading bits. Global unicast addresses (commonly 2000::/3) are publicly routable. Link-local addresses (fe80::/10) are valid only on a single link and are automatically configured on every interface. Multicast (ff00::/8) replaces IPv4 broadcast for group communication. Anycast is the same address assigned to multiple nodes, with packets delivered to the nearest. The loopback address ::1 refers to the local host, and the unspecified address :: means "no address." IPv4-mapped addresses (::ffff:a.b.c.d) represent IPv4 nodes in a dual-stack system.

## Method
1. Read the leading bits or hextet to classify the address.
2. Note its scope: link-local, interface-local, link, site (deprecated), or global.
3. Identify how it was assigned: SLAAC via EUI-64, DHCPv6, or static configuration.
4. Verify which scope a destination requires before testing connectivity.

## Example
Classify addresses from a lab host:
```bash
ip -6 addr show <LAB_IFACE>    # <LAB> look for fe80:: and global addresses
ping -6 fe80::1%<LAB_IFACE>    # <LAB> link-local needs a zone (scope) index
```

## Comparison
| Type | Prefix | Routable globally |
|---|---|---|
| Global unicast | 2000::/3 | Yes |
| Link-local | fe80::/10 | No, single link |
| Multicast | ff00::/8 | Depends on scope |
| Loopback | ::1 | No |

## Common mistakes
- Forgetting the zone identifier (%eth0) when pinging a link-local address.
- Assuming EUI-64 MAC-derived identifiers are private; they expose hardware identity and are often randomized.
- Treating anycast as multicast; anycast delivers to one node, multicast to all group members.

## Defense / verification
Use `ip -6 addr` and classify each address by prefix. In the lab, confirm that link-local traffic stays on the segment by capturing with `tcpdump ip6`.

## Knowledge check
Q: Which prefix identifies link-local IPv6 addresses?
A: fe80::/10.

===MODULE===
TITLE: Neighbor Discovery Protocol and ICMPv6
LEVEL: Intermediate
MINUTES: 40
SUMMARY: Learn how IPv6 uses ICMPv6 Neighbor Discovery for router discovery, address resolution, duplicate address detection, and redirects.
OBJECTIVES: Explain RS/RA and NS/NA exchanges | Describe DAD | Contrast NDP with ARP
TAKEAWAYS: NDP replaces ARP and several ICMPv4 helper functions | Router advertisements enable SLAAC | Neighbor solicitation is multicast
PRACTICE: In your lab, capture ICMPv6 router advertisements and neighbor solicitations while hosts communicate.
SOURCES: None
---
## Core idea
IPv6 has no ARP. Instead, ICMPv6 Neighbor Discovery (NDP) performs address resolution, router discovery, prefix discovery, duplicate address detection, and redirect signaling. The mental model: NDP is ARP, router advertisements, and ICMP redirects combined into one protocol, carried by multicast instead of broadcast. A host sends a Router Solicitation (RS) to find routers; routers reply with Router Advertisements (RA) containing prefixes and default gateway information. To resolve a neighbor's link-layer address, a host sends a Neighbor Solicitation (NS) to a solicited-node multicast address; the owner answers with a Neighbor Advertisement (NA).

## Method
1. Observe RS/RA to see how hosts learn prefixes and the default gateway.
2. Watch NS/NA to resolve an IPv6 address to a MAC address.
3. Understand Duplicate Address Detection (DAD): a host sends NS for its own tentative address before using it.
4. Note that link-local addresses are always used as the source for NDP messages.

## Example
Capture NDP traffic on a lab link:
```bash
sudo tcpdump -i <LAB_IFACE> icmp6 -c 10     # <LAB> observe RS, RA, NS, NA
ip -6 neigh show                            # <LAB> inspect the IPv6 neighbor cache
```

## Comparison
| Function | IPv4 | IPv6 |
|---|---|---|
| Address resolution | ARP broadcast | NS/NA multicast |
| Router discovery | DHCP option 3 | Router advertisements |
| Duplicate detection | Gratuitous ARP | DAD via NS |

## Common mistakes
- Looking for ARP traffic on an IPv6-only link; there is none.
- Filtering only broadcast when NDP uses multicast, so captures appear empty.
- Ignoring RA guard considerations in untrusted lab segments.

## Defense / verification
Verify neighbor entries with `ip -6 neigh show`. On managed switches, enable RA guard and DHCPv6 shield features to prevent rogue router advertisements in production.

## Knowledge check
Q: Which ICMPv6 message does a host send to check whether an address is already in use?
A: A Neighbor Solicitation for the tentative address (Duplicate Address Detection).

===MODULE===
TITLE: DHCPv4: Dynamic Host Configuration
LEVEL: Beginner
MINUTES: 40
SUMMARY: Learn the DORA exchange by which DHCPv4 assigns IP addresses and options, plus leases, renewal, and relay agents.
OBJECTIVES: Describe the DORA four-step exchange | Interpret lease and option data | Explain DHCP relay
TAKEAWAYS: Discover, Offer, Request, Acknowledge is the lease flow | Options carry gateway, DNS, and mask | Renewal happens at half the lease time
PRACTICE: In an isolated lab, run a DHCP server for your test segment and capture the DORA exchange from a client.
SOURCES: None
---
## Core idea
DHCPv4 automatically gives hosts an IP address and configuration options. The mental model: a new host raises its hand and asks "is there a server?" (Discover), the server offers an address (Offer), the host accepts one (Request), and the server confirms with options and a lease duration (Acknowledge). This is the DORA flow. Options carry the subnet mask, default gateway, DNS servers, and other settings. Leases are temporary; a client renews at half the lease time (T1) and again later (T2). DHCP relays forward broadcasts across subnets to a central server.

## Method
1. Client broadcasts DHCP Discover from 0.0.0.0:68 to 255.255.255.255:67.
2. Server broadcasts or unicasts DHCP Offer with a candidate address and options.
3. Client broadcasts DHCP Request naming the chosen server and address.
4. Server sends DHCP Acknowledge, and the client configures the interface.

## Example
Observe the exchange in an isolated lab:
```bash
sudo tcpdump -i <LAB_IFACE> 'port 67 or port 68' -c 8    # <LAB> capture DORA
ip addr show <LAB_IFACE>                               # <LAB> confirm assigned address
```

## Comparison
| Message | Sender | Destination | Purpose |
|---|---|---|---|
| Discover | Client | Broadcast | Find a server |
| Offer | Server | Broadcast/Unicast | Propose an address |
| Request | Client | Broadcast | Accept a proposal |
| Acknowledge | Server | Broadcast/Unicast | Confirm and deliver options |

## Common mistakes
- Expecting DHCP to cross routers without a relay; Discover is a broadcast.
- Confusing the DHCP server address with the default gateway option.
- Ignoring lease exhaustion, which leaves clients with link-local addresses.

## Defense / verification
Confirm the assigned address, mask, gateway, and DNS with `ip addr` and `/etc/resolv.conf`. On managed networks, use DHCP snooping to prevent rogue servers in the lab.

## Knowledge check
Q: At what point in the lease does a client typically attempt renewal?
A: At T1, usually half of the lease duration.

===MODULE===
TITLE: DHCPv6 and Stateless Address Autoconfiguration
LEVEL: Intermediate
MINUTES: 40
SUMMARY: Compare SLAAC, stateless DHCPv6, and stateful DHCPv6 for IPv6 address and option assignment.
OBJECTIVES: Explain SLAAC address formation | Contrast stateful and stateless DHCPv6 | Interpret RA flags
TAKEAWAYS: SLAAC combines a /64 prefix with an interface identifier | DHCPv6 delivers options such as DNS | RA flags choose the mode
PRACTICE: On a lab IPv6 network, enable SLAAC on a host and verify the generated address and default route from router advertisements.
SOURCES: None
---
## Core idea
IPv6 hosts can configure themselves without a DHCP server. Stateless Address Autoconfiguration (SLAAC) takes the /64 prefix advertised in a Router Advertisement and appends an interface identifier, often derived from the MAC via EUI-64 or generated randomly for privacy. The mental model: the router announces the neighborhood name (prefix), and each host picks its own house number. DHCPv6 comes in two flavors: stateless supplies extra options such as DNS servers while addresses come from SLAAC, and stateful hands out addresses and tracks leases much like DHCPv4. RA flags — the Autonomous and Managed flags — tell hosts which mode to use.

## Method
1. Capture the RA and note the prefix, prefix length, and Autonomous/Managed flag settings.
2. If Autonomous is set, form an address from the prefix plus an interface identifier.
3. Perform Duplicate Address Detection before assigning it.
4. Use DHCPv6 for additional options (stateless) or for full address management (stateful).

## Example
Inspect lab SLAAC configuration:
```bash
sudo sysctl net.ipv6.conf.<LAB_IFACE>.autoconf   # <LAB> check SLAAC enabled
ip -6 addr show <LAB_IFACE>                     # <LAB> view SLAAC address
ip -6 route show default                        # <LAB> default route from RA
```

## Comparison
| Method | Address source | Options source | State kept |
|---|---|---|---|
| SLAAC | RA prefix + IID | RA only | No |
| Stateless DHCPv6 | SLAAC | DHCPv6 server | No |
| Stateful DHCPv6 | DHCPv6 server | DHCPv6 server | Yes |

## Common mistakes
- Assuming /64 is wasteful and using a longer prefix, which breaks SLAAC.
- Expecting DHCPv6 to distribute a default gateway; that comes from router advertisements.
- Ignoring privacy extensions that periodically change the interface identifier.

## Defense / verification
Verify the SLAAC address, its scope, and the default route with `ip -6 addr` and `ip -6 route`. Confirm RA settings match the intended mode on your lab router.

## Knowledge check
Q: Where does a SLAAC host learn its default gateway?
A: From the source of the Router Advertisement, not from DHCPv6.

===MODULE===
TITLE: IP Configuration Verification and Connectivity Troubleshooting
LEVEL: Intermediate
MINUTES: 35
SUMMARY: Build a repeatable method for verifying IP configuration and diagnosing connectivity failures across local links and routed paths.
OBJECTIVES: Inspect addresses, routes, and neighbors | Isolate each layer methodically | Interpret ping and traceroute results
TAKEAWAYS: Verify from the bottom layer upward | Local neighbor failure differs from remote routing failure | Document expected state before changing anything
PRACTICE: In your lab, intentionally misconfigure a mask on a test host and diagnose it using only ip, ping, and tcpdump.
SOURCES: None
---
## Core idea
Connectivity troubleshooting is a process of elimination across layers. The mental model: check that the host has the right identity (address and mask), knows its local neighbors (ARP/NDP), has a path (routing table), and can reach the service (transport and application). Beginning at the lowest failing layer avoids wasted effort. A ping to the gateway tests the local link; a ping to a remote host tests routing; a TCP connection test tests transport and service state. Each tool reveals one layer, so combine them rather than relying on a single check.

## Method
1. Verify interface state, address, and mask with `ip addr`.
2. Check neighbor resolution with `ip neigh` (ARP) or `ip -6 neigh`.
3. Inspect the routing table with `ip route` and confirm a path to the destination.
4. Test with ping, then traceroute, then a transport-layer tool such as `nc -vz`.

## Example
Run a structured lab check:
```bash
ip addr show <LAB_IFACE>          # <LAB> identity and mask
ip neigh show                     # <LAB> local resolution
ip route get <LAB_TARGET>         # <LAB> chosen path
ping -c 3 <LAB_TARGET>            # <LAB> reachability
nc -vz <LAB_TARGET> <LAB_PORT>    # <LAB> transport reachability
```

## Comparison
| Symptom | Likely layer | First tool |
|---|---|---|
| No link, no address | Physical/Data Link | ip link, ethtool |
| Can't reach gateway | Network local | ip neigh, ping |
| Can't reach remote | Routing | ip route, traceroute |
| Ping works, service fails | Transport/App | nc, tcpdump |

## Common mistakes
- Rebooting before recording the failing state.
- Assuming DNS is the problem when the address itself is wrong.
- Testing only one direction and missing asymmetric routing.

## Defense / verification
Record the expected configuration before making changes, and verify after each single change. Use `tcpdump` to confirm whether packets leave the interface and whether replies return.

## Knowledge check
Q: You can ping the default gateway but not a remote host. Which layer is most likely failing?
A: Routing (Layer 3) beyond the local link — check the routing table and upstream path.

===MODULE===
TITLE: TCP Segments and the Three-Way Handshake
LEVEL: Intermediate
MINUTES: 40
SUMMARY: Learn the TCP segment header and how the SYN, SYN-ACK, ACK handshake establishes a reliable connection before data flows.
OBJECTIVES: Parse a TCP header | Trace the three-way handshake | Explain why a handshake is needed
TAKEAWAYS: TCP is connection-oriented and byte-stream based | SYN carries an initial sequence number | The handshake synchronizes both directions
PRACTICE: In your lab, initiate a TCP connection to a local service and capture the three-way handshake.
SOURCES: None
---
## Core idea
TCP provides a reliable, ordered byte stream between two applications. Before data is exchanged, both endpoints must agree on initial sequence numbers and window sizes through a three-way handshake. The mental model: two people agree on a starting page number for their conversation before reading aloud, so any missing page can be detected. The client sends a SYN with its initial sequence number (ISN). The server replies with SYN-ACK containing its own ISN and an acknowledgment of the client's ISN plus one. The client sends ACK acknowledging the server's ISN plus one. Only then does application data flow.

## Method
1. Identify the TCP header fields: source/destination ports, sequence number, acknowledgment number, data offset, flags, window, checksum, urgent pointer.
2. Follow the SYN: ISN = x, no acknowledgment.
3. Follow the SYN-ACK: ISN = y, ACK = x + 1.
4. Follow the ACK: ACK = y + 1; connection is established.

## Example
Capture a handshake in the lab:
```bash
sudo tcpdump -i <LAB_IFACE> 'tcp port <LAB_PORT>' -c 3    # <LAB> SYN, SYN-ACK, ACK
nc -vz <LAB_HOST> <LAB_PORT>                             # <LAB> generate a connection
```

## Comparison
| Step | Flags | Sequence | Acknowledgment |
|---|---|---|---|
| 1 | SYN | x | 0 |
| 2 | SYN, ACK | y | x + 1 |
| 3 | ACK | x + 1 | y + 1 |

## Common mistakes
- Reading the sequence number as a packet count; it counts bytes.
- Assuming the handshake carries application data; it does not normally.
- Confusing the acknowledgment number with the next sequence number to send; it is the next byte expected from the peer.

## Defense / verification
Verify all three packets appear in order in your capture. In production, a SYN flood fills the handshake queue; SYN cookies and rate limiting are common defenses.

## Knowledge check
Q: In the three-way handshake, what does the server acknowledge in its SYN-ACK?
A: The client's initial sequence number plus one.

===MODULE===
TITLE: The TCP State Machine and Connection Teardown
LEVEL: Intermediate
MINUTES: 40
SUMMARY: Follow TCP connection states from LISTEN through ESTABLISHED to TIME_WAIT, and understand graceful and abrupt teardown.
OBJECTIVES: Name the main TCP states | Trace a four-way FIN teardown | Explain TIME_WAIT
TAKEAWAYS: Each socket moves through a defined state machine | FIN teardown uses four messages | TIME_WAIT prevents delayed packets from confusing new connections
PRACTICE: On your lab host, open and close a TCP connection while watching socket states with ss and a packet capture.
SOURCES: None
---
## Core idea
A TCP connection is not just "open" or "closed"; it moves through a state machine. The mental model: a connection is like a phone call with formal phases — waiting for a ring (LISTEN), answering (SYN_RECEIVED), talking (ESTABLISHED), and hanging up carefully (FIN_WAIT, TIME_WAIT, CLOSED). A graceful close uses four messages because each direction must close independently: each side sends a FIN and acknowledges the other's FIN. The side that sends the first FIN enters TIME_WAIT, waiting twice the maximum segment lifetime so late packets from the old connection cannot be mistaken for a new one.

## Method
1. Start in LISTEN on the server and SYN_SENT on the client.
2. After the handshake, both sides reach ESTABLISHED.
3. On close, the initiator sends FIN; peer acknowledges and later sends its own FIN.
4. The initiator acknowledges and remains in TIME_WAIT before CLOSED.

## Example
Observe states in the lab:
```bash
ss -tan state established          # <LAB> list established sockets
ss -tan state time-wait             # <LAB> observe TIME_WAIT sockets
sudo tcpdump -i <LAB_IFACE> 'tcp port <LAB_PORT>' -c 8  # <LAB> capture FIN exchange
```

## Comparison
| State | Meaning |
|---|---|
| LISTEN | Waiting for incoming connections |
| ESTABLISHED | Data can flow both ways |
| FIN_WAIT_1/2 | Waiting for peer's FIN or ACK |
| TIME_WAIT | Waiting for late packets to expire |

## Common mistakes
- Treating TIME_WAIT as a leak; it is normal and protective.
- Assuming a single FIN closes both directions.
- Confusing RST (abort) with FIN (graceful close).

## Defense / verification
Use `ss -tan` to confirm expected states. A large number of connections stuck in SYN_RECEIVED suggests a handshake problem; excessive RSTs suggest an application or firewall aborting sessions.

## Knowledge check
Q: Which state does the side that initiates the close enter last before CLOSED?
A: TIME_WAIT.

===MODULE===
TITLE: TCP Flags, Sequencing, and Reliability
LEVEL: Intermediate
MINUTES: 40
SUMMARY: Understand TCP control flags and how sequence and acknowledgment numbers provide ordered, lossless delivery.
OBJECTIVES: Interpret SYN, ACK, FIN, RST, PSH, and URG | Explain byte-stream sequencing | Describe cumulative acknowledgments
TAKEAWAYS: Flags control connection behavior | Sequence numbers count bytes, not packets | ACKs are cumulative
PRACTICE: In your lab, transfer a file between hosts and capture TCP to observe sequence and acknowledgment numbers advancing.
SOURCES: None
---
## Core idea
TCP reliability comes from numbering every byte and acknowledging bytes received. The mental model: TCP is a conveyor belt where each item has a serial number; the receiver says "I have everything up to serial number N," which is a cumulative acknowledgment. Flags in the header signal control actions: SYN synchronizes sequence numbers, ACK validates the acknowledgment field, FIN closes gracefully, RST aborts immediately, PSH asks the receiver to deliver data promptly, and URG marks urgent data. Selective acknowledgment options let a receiver report multiple missing blocks when several packets are lost.

## Method
1. Read the flags byte and identify which control bits are set.
2. Track the sequence number and add the payload length to find the next expected sequence number.
3. Verify the acknowledgment number equals the next byte the sender expects from the peer.
4. Note retransmissions when an expected sequence number never arrives.

## Example
Observe byte counting in a lab transfer:
```bash
sudo tcpdump -i <LAB_IFACE> 'tcp port <LAB_PORT>' -c 10    # <LAB> watch seq/ack advance
dd if=/dev/zero bs=1K count=1 | nc <LAB_HOST> <LAB_PORT>   # <LAB> generate data
```

## Comparison
| Flag | Role |
|---|---|
| SYN | Synchronize sequence numbers |
| ACK | Acknowledgment field is valid |
| FIN | Graceful close |
| RST | Immediate abort |
| PSH | Push data to application |

## Common mistakes
- Assuming each packet is acknowledged individually; acknowledgments are cumulative.
- Treating PSH as a guarantee of immediate delivery; it is a hint.
- Ignoring the fact that SYN and FIN each consume one sequence number.

## Defense / verification
Follow a stream in Wireshark using the TCP sequence graph. In the lab, confirm that acknowledgments advance by the number of payload bytes received.

## Knowledge check
Q: How many sequence numbers does a SYN consume?
A: One.

===MODULE===
TITLE: TCP Retransmission, Flow Control, and Congestion Control
LEVEL: Advanced
MINUTES: 45
SUMMARY: Learn how TCP recovers lost segments, prevents overwhelming a receiver with flow control, and adapts to network congestion.
OBJECTIVES: Explain retransmission triggers | Describe the sliding window | Compare slow start and congestion avoidance
TAKEAWAYS: Retransmission timeout and duplicate ACKs drive recovery | The receive window implements flow control | Congestion window implements network safety
PRACTICE: In a lab with controlled packet loss, capture TCP to observe retransmissions and window changes.
SOURCES: None
---
## Core idea
TCP must recover from loss without flooding the network. The mental model: a sender has two brakes — a receiver brake (the receive window, which prevents overwhelming the application) and a network brake (the congestion window, which prevents overwhelming the path). The effective send window is the smaller of the two. Loss is detected by a retransmission timeout or by receiving duplicate ACKs. Modern TCP uses algorithms such as Reno, Cubic, or BBR to grow the congestion window during slow start and congestion avoidance, and to shrink it when loss or delay signals congestion.

## Method
1. Track the receive window value advertised in ACK packets.
2. Identify retransmissions: same sequence number sent again after a timeout or three duplicate ACKs.
3. Observe slow start: congestion window doubles each round trip until a threshold.
4. Observe congestion avoidance: linear growth, with a reduction on loss.

## Example
Inspect loss and window behavior in the lab:
```bash
sudo tcpdump -i <LAB_IFACE> 'tcp port <LAB_PORT>' -c 20   # <LAB> look for [Retransmission]
ss -ti                                                  # <LAB> view per-socket cwnd and rtt
```

## Comparison
| Mechanism | Protects | Signal |
|---|---|---|
| Receive window | Receiver buffers | Window field in ACK |
| Congestion window | Network path | Loss or delay |
| Fast retransmit | Lost segment | Three duplicate ACKs |

## Common mistakes
- Equating a zero window with a failure; it usually means the application is busy, not that the connection is dead.
- Assuming all loss is congestion; wireless loss can be local.
- Ignoring that window scaling options change advertised values dramatically.

## Defense / verification
Use `ss -ti` to inspect congestion window, round-trip time, and retransmission counts. In your lab, introduce controlled loss with a traffic-shaping tool and verify the sender backs off.

## Knowledge check
Q: What event typically triggers fast retransmit?
A: Three duplicate ACKs for the same segment.

===MODULE===
TITLE: UDP: Datagrams and Use Cases
LEVEL: Beginner
MINUTES: 30
SUMMARY: Learn the connectionless User Datagram Protocol, its minimal header, and why applications choose it over TCP.
OBJECTIVES: Parse a UDP header | Contrast UDP with TCP | Name typical UDP applications
TAKEAWAYS: UDP is connectionless and unordered | It adds only ports, length, and checksum | Applications handle reliability themselves when needed
PRACTICE: In your lab, generate UDP traffic with a simple tool and capture the datagrams to inspect the header.
SOURCES: None
---
## Core idea
UDP is the minimal transport protocol: it adds only source port, destination port, length, and checksum to an IP payload. The mental model: TCP is a registered letter with tracking and confirmation; UDP is a postcard — quick, cheap, and not guaranteed. There is no handshake, no sequence number, no acknowledgment, and no retransmission. This makes UDP ideal for latency-sensitive or one-to-many traffic such as DNS queries, voice and video streaming, and broadcast/multicast discovery, where applications can tolerate occasional loss or implement their own reliability.

## Method
1. Identify the four 16-bit UDP header fields.
2. Note that the checksum is optional in IPv4 but mandatory in IPv6.
3. Contrast behavior: no handshake, no ordering, no flow or congestion control.
4. Decide whether the application needs reliability and implement it above UDP if so.

## Example
Generate and capture lab UDP traffic:
```bash
echo "lab" | nc -u <LAB_HOST> <LAB_PORT>            # <LAB> send a UDP datagram
sudo tcpdump -i <LAB_IFACE> udp -c 3                # <LAB> inspect UDP header
```

## Comparison
| Property | TCP | UDP |
|---|---|---|
| Connection | Oriented | Connectionless |
| Reliability | Guaranteed | Best effort |
| Header size | 20+ bytes | 8 bytes |
| Ordering | Ordered | Unordered |

## Common mistakes
- Assuming UDP means the application does not care about loss; many protocols add their own recovery.
- Forgetting that UDP checksums are optional in IPv4, so corruption can go undetected.
- Treating UDP as inherently insecure; security depends on the application and any encryption used.

## Defense / verification
Verify UDP flows with `tcpdump udp` and check server-side application logs. Because there is no connection state, firewalls must track UDP by timeout and port pairs.

## Knowledge check
Q: How large is the UDP header?
A: Eight bytes.

===MODULE===
TITLE: Ports, Sockets, and Transport Multiplexing
LEVEL: Beginner
MINUTES: 30
SUMMARY: Learn how ports and sockets let one host run many network applications simultaneously and distinguish client from server roles.
OBJECTIVES: Explain well-known, registered, and ephemeral ports | Define a socket | Trace a connection's four-tuple
TAKEAWAYS: A socket is an IP address plus a port | Servers listen on well-known ports | Clients use ephemeral source ports
PRACTICE: On your lab host, list listening sockets and identify the local and remote endpoints of an active connection.
SOURCES: None
---
## Core idea
IP addresses identify hosts; ports identify applications or services on those hosts. The mental model: an IP address is a building street address and a port is the apartment number, so many services share one address without confusion. A socket is the combination of an IP address and a port, and a TCP connection is uniquely identified by a four-tuple: source IP, source port, destination IP, destination port. Well-known ports (0-1023) are assigned to common services such as 80 for HTTP and 53 for DNS; registered ports run 1024-49151, and ephemeral ports (typically 49152-65535) are chosen dynamically by clients.

## Method
1. Classify a port by range and identify the service commonly associated with it.
2. Combine an address and port to form a socket.
3. Track the four-tuple of a connection to distinguish simultaneous sessions.
4. List listening sockets to see which services accept connections on the host.

## Example
Inspect sockets in the lab:
```bash
ss -tuln                  # <LAB> list listening TCP and UDP sockets
ss -tan                   # <LAB> view connection four-tuples and states
```

## Comparison
| Port range | Name | Example |
|---|---|---|
| 0-1023 | Well-known | 80 HTTP, 443 HTTPS, 53 DNS |
| 1024-49151 | Registered | 3389 RDP, 3306 MySQL |
| 49152-65535 | Ephemeral | Client source ports |

## Common mistakes
- Assuming a well-known port guarantees the expected service; services can run on arbitrary ports.
- Confusing a listening socket with an established connection.
- Overlooking that NAT rewrites the client's source port, changing the observed four-tuple.

## Defense / verification
Use `ss -tuln` to audit listening ports on your lab host and close unneeded services. Document expected ports so unexpected listeners stand out during review.

## Knowledge check
Q: What four values uniquely identify a TCP connection?
A: Source IP, source port, destination IP, and destination port.

===MODULE===
TITLE: DNS Architecture and the Hierarchical Namespace
LEVEL: Intermediate
MINUTES: 35
SUMMARY: Learn the distributed, hierarchical structure of DNS, including root, top-level, authoritative, and recursive servers.
OBJECTIVES: Describe the DNS hierarchy | Distinguish authoritative from recursive servers | Read a fully qualified domain name
TAKEAWAYS: DNS is a distributed database organized as a tree | Roots delegate to TLDs, which delegate to authoritative zones | FQDNs read from host to root, right to left
PRACTICE: In your lab, trace the hierarchy of a name you control or a public name using dig from the root down.
SOURCES: None
---
## Core idea
DNS translates human-readable names into IP addresses using a distributed hierarchy rather than one central database. The mental model: DNS is an inverted tree. The root sits at the top, below it are top-level domains such as .com and .org, below those are second-level domains, and below those are host names. A fully qualified domain name (FQDN) lists labels from most specific to least, ending with a trailing dot representing the root. Authority is delegated downward: the root refers to TLD servers, TLD servers refer to authoritative servers for a zone, and those servers hold the actual records.

## Method
1. Read an FQDN from right to left: host, domain, TLD, root.
2. Identify which server is authoritative for the zone holding the name.
3. Distinguish recursive resolvers, which answer on behalf of clients, from authoritative servers, which own zone data.
4. Follow delegations from root to TLD to authoritative using NS records.

## Example
Walk the hierarchy in the lab:
```bash
dig +norec @<LAB_ROOT_HINT> <LAB_NAME> NS    # <LAB> query a root hint
dig +trace <LAB_NAME>                        # <LAB> follow the full delegation chain
```

## Comparison
| Server type | Role |
|---|---|
| Recursive resolver | Queries on behalf of clients and caches answers |
| Root server | Points to TLD servers |
| TLD server | Points to authoritative servers |
| Authoritative server | Holds the zone's records |

## Common mistakes
- Assuming a recursive resolver stores the original zone data; it only caches results.
- Forgetting the trailing dot that denotes the root in an FQDN.
- Thinking one server knows the entire namespace; delegation is the core design.

## Defense / verification
Use `dig +trace` to confirm each delegation step. In your lab, point a client at your own resolver and verify it reaches the expected authoritative server.

## Knowledge check
Q: Which server type is authoritative for a zone?
A: The authoritative name server that hosts and serves the zone's records.

===MODULE===
TITLE: DNS Resolution: Recursive and Iterative Queries
LEVEL: Intermediate
MINUTES: 40
SUMMARY: Trace how a DNS lookup proceeds from a client stub resolver through a recursive resolver and iterative referrals to an answer.
OBJECTIVES: Distinguish recursive from iterative queries | Follow a lookup step by step | Explain referral responses
TAKEAWAYS: Clients ask resolvers recursively | Resolvers ask servers iteratively | Referrals lead the resolver down the tree
PRACTICE: In your lab, run dig with and without recursion and compare the responses and packet flows.
SOURCES: None
---
## Core idea
A typical lookup starts when a stub resolver on a client asks its configured recursive resolver for a name. The mental model: you ask a librarian to find a book (recursive request); the librarian checks the catalog, then visits sections one by one (iterative requests), following referrals until the book is found. A recursive query means the server must return either a final answer or an error. An iterative query means the server may reply with a referral to a more authoritative server. The resolver caches each result and walks from root to TLD to authoritative server until it obtains the answer for the client.

## Method
1. Client sends a recursive query for the name to its configured resolver.
2. Resolver checks its cache; on a miss, it queries a root server iteratively.
3. Root returns a referral to the TLD server; resolver queries that TLD server.
4. TLD returns a referral to the authoritative server, which supplies the answer.

## Example
Compare recursive and iterative behavior in the lab:
```bash
dig <LAB_NAME> A                    # <LAB> recursive query via local resolver
dig +norec @<LAB_AUTH_SERVER> <LAB_NAME> A   # <LAB> direct iterative-style query
dig +trace <LAB_NAME>               # <LAB> observe each referral
```

## Comparison
| Query type | Server obligation | Typical sender |
|---|---|---|
| Recursive | Return final answer or error | Client to resolver |
| Iterative | Return best answer or referral | Resolver to authority |

## Common mistakes
- Confusing the referral with the final answer; a referral contains NS records and glue, not the requested record.
- Assuming the resolver always starts at the root; cached referrals let it start lower.
- Forgetting that UDP is typical but DNS can use TCP for large responses or zone transfers.

## Defense / verification
Capture DNS traffic in your lab and confirm the recursion-desired and recursion-available flags. Verify the final answer matches the authoritative zone data.

## Knowledge check
Q: What does a server return when it cannot answer but knows who can?
A: A referral containing NS records for a more authoritative server.

===MODULE===
TITLE: DNS Record Types
LEVEL: Intermediate
MINUTES: 35
SUMMARY: Learn the common DNS resource records — A, AAAA, CNAME, MX, NS, TXT, SOA, PTR, and SRV — and what each is used for.
OBJECTIVES: Identify common record types | Explain aliases versus canonical names | Read an SOA record
TAKEAWAYS: A maps IPv4, AAAA maps IPv6 | CNAME aliases point to another name | MX, NS, and SOA support mail and zone delegation
PRACTICE: In your lab zone, query each record type you create and verify the returned data.
SOURCES: None
---
## Core idea
DNS stores information as resource records in zones. Each record has a name, type, class, TTL, and value. The mental model: a zone is a phone book where different record types are different columns — one for IPv4 numbers, one for IPv6, one for mail servers, one for aliases. A records map a name to IPv4; AAAA records map to IPv6; CNAME creates an alias to another canonical name; MX identifies mail exchangers with priorities; NS lists authoritative servers; SOA holds zone metadata such as the primary server and serial number; TXT carries arbitrary text used for verification and policy records; PTR maps addresses back to names; SRV locates services.

## Method
1. Read the record name, type, TTL, and RDATA from query output.
2. Distinguish canonical names from aliases; a CNAME cannot coexist with other records at the same name.
3. Use MX priority to order mail servers, with lower values preferred.
4. Track the SOA serial to detect zone changes.

## Example
Query lab records:
```bash
dig <LAB_NAME> A AAAA MX NS TXT SOA +short    # <LAB> retrieve several record types
dig -x <LAB_IP> PTR +short                    # <LAB> reverse lookup
```

## Comparison
| Record | Maps/Provides | Typical value |
|---|---|---|
| A | Name to IPv4 | 192.0.2.10 |
| AAAA | Name to IPv6 | 2001:db8::10 |
| CNAME | Alias to canonical name | www.example.com. |
| MX | Mail server with priority | 10 mail.example.com. |

## Common mistakes
- Placing a CNAME at the zone apex or alongside other records, which breaks the zone.
- Forgetting the trailing dot in fully qualified values, causing accidental relative names.
- Treating TXT as free-form without quoting long strings correctly.

## Defense / verification
Query your lab zone directly against its authoritative server with `dig @<LAB_AUTH_SERVER>`. Confirm TTLs and values match the zone file.

## Knowledge check
Q: Which record type maps an IPv4 address back to a hostname?
A: PTR, used in reverse lookup zones.

===MODULE===
TITLE: DNS Caching and Time to Live
LEVEL: Intermediate
MINUTES: 35
SUMMARY: Understand how DNS caching reduces query load, how TTL controls freshness, and how negative caching works.
OBJECTIVES: Explain resolver and client caches | Interpret TTL values | Describe negative caching
TAKEAWAYS: Caching happens at browsers, OS resolvers, and recursive servers | TTL sets how long an answer may be reused | Negative answers are cached using SOA minimum TTL
PRACTICE: In your lab, change a record and measure how long clients keep the old answer, then flush caches to observe the update.
SOURCES: None
---
## Core idea
DNS is heavily cached to keep the system fast and scalable. The mental model: every resolver keeps a notepad of recent answers with expiry times; until the note expires, it reuses the answer instead of asking again. Caches live in browsers, operating systems, and recursive resolvers. Each resource record carries a Time to Live in seconds that dictates how long it may be cached. Negative answers, such as NXDOMAIN for a nonexistent name, are cached too, using the negative TTL derived from the zone's SOA record. This means changes to DNS can take time to propagate worldwide.

## Method
1. Query a record and read the TTL from the answer section.
2. Identify where caching may occur along the path from client to authoritative server.
3. Plan changes by lowering TTL in advance of a migration.
4. Flush or wait out caches when verifying a change.

## Example
Observe TTL decay in the lab:
```bash
dig <LAB_NAME> A                    # <LAB> note the TTL value
dig <LAB_NAME> A                    # <LAB> TTL decreases between queries
sudo systemd-resolve --flush-caches # <LAB> clear the local resolver cache (if present)
```

## Comparison
| Cache location | Scope | Flush method |
|---|---|---|
| Browser | Single browser | Browser settings |
| OS resolver | Single host | OS-specific command |
| Recursive resolver | Many clients | Resolver admin action |

## Common mistakes
- Expecting a DNS change to take effect instantly everywhere.
- Setting very long TTLs before a planned migration, delaying rollback.
- Assuming every client shares the same cached answer; caches are independent.

## Defense / verification
Check the TTL with `dig` before and after a change. In your lab, lower the TTL well ahead of a cutover and verify caches expire as predicted.

## Knowledge check
Q: What does a TTL of 300 mean?
A: The answer may be cached for 300 seconds before it must be refreshed.

===MODULE===
TITLE: DNSSEC Fundamentals
LEVEL: Advanced
MINUTES: 45
SUMMARY: Learn how DNSSEC uses digital signatures and a chain of trust to prove DNS answers have not been forged or tampered with.
OBJECTIVES: Explain the DNSSEC chain of trust | Describe RRSIG, DNSKEY, DS, and NSEC records | Validate a signed answer
TAKEAWAYS: DNSSEC signs records, not encrypts them | Trust flows from the root down through DS and DNSKEY records | Authenticated denial of existence uses NSEC/NSEC3
PRACTICE: In your lab, query a signed zone with DNSSEC validation enabled and inspect the signature records.
SOURCES: None
---
## Core idea
DNS was designed without authentication, so answers can be spoofed. DNSSEC adds integrity and authenticity by signing resource record sets. The mental model: each zone signs its records with a private key and publishes the public key; the parent signs a hash of that key, creating a chain of trust from the root down to the zone. A validating resolver starts from a trust anchor (the root key) and verifies each link. DNSSEC does not encrypt DNS traffic; it proves the data is authentic and unmodified. Signed denial of existence is provided by NSEC or NSEC3 records rather than by an empty answer.

## Method
1. Understand RRSIG: a signature over a record set, with algorithm and expiration fields.
2. Understand DNSKEY: the public keys published in a zone (ZSK and KSK).
3. Understand DS: a hash of the child's key stored in the parent zone to link the chain.
4. Use NSEC/NSEC3 to prove that a name or type does not exist.

## Example
Inspect DNSSEC records in the lab:
```bash
dig +dnssec <LAB_SIGNED_NAME> A          # <LAB> look for RRSIG in the answer
dig <LAB_ZONE> DNSKEY +short             # <LAB> view public keys
dig <LAB_ZONE> DS +short                 # <LAB> view the parent's delegation signer
```

## Comparison
| Record | Purpose |
|---|---|
| RRSIG | Signature over a record set |
| DNSKEY | Public verification key |
| DS | Parent's hash of child key |
| NSEC/NSEC3 | Authenticated denial of existence |

## Common mistakes
- Assuming DNSSEC provides confidentiality; queries and responses remain visible.
- Forgetting that signatures expire, so stale zones cause validation failures.
- Confusing a validating resolver with an authoritative server; the resolver performs validation.

## Defense / verification
Enable validation on your lab resolver and check the `ad` (authentic data) flag in `dig` output. Investigate SERVFAIL responses, which often indicate validation failure rather than an absent name.

## Knowledge check
Q: Which DNSSEC record links a child zone's key to its parent?
A: The DS (delegation signer) record.

===MODULE===
TITLE: DNS in Practice: Queries and Troubleshooting
LEVEL: Intermediate
MINUTES: 35
SUMMARY: Use dig and nslookup effectively to diagnose DNS failures, distinguish resolver problems from authoritative problems, and read response flags.
OBJECTIVES: Read dig output sections | Interpret response flags and status | Isolate DNS failure points
TAKEAWAYS: dig separates question, answer, authority, and additional sections | Flags reveal recursion and authority | SERVFAIL, NXDOMAIN, and NOERROR mean different things
PRACTICE: In your lab, break a zone record intentionally and diagnose the failure using dig against both the local resolver and the authoritative server.
SOURCES: None
---
## Core idea
Effective DNS troubleshooting means knowing which server you asked and what it answered. The mental model: separate the client's view from the authoritative truth. A query to the configured resolver tests the whole resolution path including caches; a direct query to the authoritative server tests the zone itself. dig output has four sections: question, answer, authority, and additional. Flags such as qr, rd, ra, and ad reveal whether recursion was requested, whether the server supports it, and whether the answer was validated. Status codes like NOERROR, NXDOMAIN, and SERVFAIL point to very different causes.

## Method
1. Query the local resolver with `dig` and read the status and flags.
2. Query the authoritative server directly to see the zone's actual data.
3. Compare results: a correct authoritative answer but wrong resolver answer suggests cache or hijacking issues.
4. Check for CNAME chains and missing glue records when delegation fails.

## Example
Run a comparative lab diagnosis:
```bash
dig <LAB_NAME> A                                # <LAB> via configured resolver
dig @<LAB_AUTH_SERVER> <LAB_NAME> A             # <LAB> direct authoritative query
dig <LAB_NAME> A +norec                         # <LAB> inspect flags without recursion
```

## Comparison
| Status | Meaning | Likely cause |
|---|---|---|
| NOERROR with answer | Success | None |
| NXDOMAIN | Name does not exist | Wrong name or deleted record |
| SERVFAIL | Server failure | Validation or upstream failure |

## Common mistakes
- Blaming DNS when the application uses a different resolver or hosts file entry.
- Misreading NXDOMAIN as a network outage.
- Ignoring CNAME chains that end at an unresolvable target.

## Defense / verification
Document the configured resolver with `resolvectl status` or `/etc/resolv.conf`. Verify answers against the authoritative server before changing zone data.

## Knowledge check
Q: What does the `ra` flag in dig output indicate?
A: Recursion Available — the server supports recursive queries.

===MODULE===
TITLE: Cryptographic Foundations for TLS
LEVEL: Advanced
MINUTES: 45
SUMMARY: Review the symmetric encryption, public-key exchange, and hashing primitives that TLS combines to provide confidentiality and integrity.
OBJECTIVES: Contrast symmetric and asymmetric encryption | Explain key exchange and hashing | Understand forward secrecy
TAKEAWAYS: Symmetric ciphers protect bulk data | Public-key crypto establishes shared secrets | Hashes and MACs provide integrity
PRACTICE: In your lab, use OpenSSL to list available ciphers and generate a key pair, then inspect their properties.
SOURCES: None
---
## Core idea
TLS combines several cryptographic tools to solve different problems. The mental model: asymmetric encryption is like mailing a locked box with a public key lock that only the recipient can open — useful for establishing a shared secret; symmetric encryption is like a fast, shared codebook for the actual conversation. Hashing and message authentication codes detect tampering, while digital signatures prove identity. Diffie-Hellman (especially its elliptic-curve form) lets two parties agree on a secret over a public channel, and ephemeral keys provide forward secrecy so past sessions remain secure even if a long-term key is later stolen.

## Method
1. Identify the three goals: confidentiality, integrity, and authentication.
2. Use symmetric ciphers (such as AES-GCM or ChaCha20) for bulk data because they are fast.
3. Use public-key algorithms (RSA or ECDHE) to authenticate and establish the session key.
4. Use hash functions and MACs to detect modification, and ephemeral keys for forward secrecy.

## Example
Explore primitives in your lab:
```bash
openssl list -cipher-algorithms | head          # <LAB> examine available ciphers
openssl genpkey -algorithm RSA -out <LAB_KEY>   # <LAB> generate a lab key pair
openssl pkey -in <LAB_KEY> -text -noout | head  # <LAB> inspect key details
```

## Comparison
| Primitive | Purpose | Speed |
|---|---|---|
| Symmetric cipher | Bulk confidentiality | Fast |
| Public-key cipher | Key exchange and signatures | Slow |
| Hash/MAC | Integrity | Fast |

## Common mistakes
- Trying to encrypt bulk traffic with asymmetric algorithms; they are far too slow.
- Confusing encoding (base64) with encryption.
- Reusing ephemeral parameters, which destroys forward secrecy.

## Defense / verification
Use `openssl s_client` to inspect which cipher suite and key exchange a lab server negotiated. Prefer AEAD ciphers and ECDHE for forward secrecy.

## Knowledge check
Q: Which primitive provides forward secrecy in modern TLS?
A: Ephemeral Diffie-Hellman key exchange, typically ECDHE.

===MODULE===
TITLE: TLS Certificate Chains and Trust
LEVEL: Advanced
MINUTES: 45
SUMMARY: Learn what an X.509 certificate contains, how certificate chains link a leaf to a trusted root, and how hosts decide whether to trust a server.
OBJECTIVES: Parse an X.509 certificate | Explain chain construction and validation | Identify hostname and expiration checks
TAKEAWAYS: A chain links leaf, intermediates, and root | Trust anchors are preinstalled in clients | Validation checks signature, validity dates, and hostname
PRACTICE: In your lab, create a private CA, issue a leaf certificate, and verify the chain with OpenSSL on a client host.
SOURCES: None
---
## Core idea
A TLS certificate binds a public key to an identity. The mental model: a certificate is a passport — it states who you are, is signed by an authority, and has an expiration date. Browsers and clients trust a small set of root certificate authorities; most servers present a leaf certificate plus intermediate certificates that link back to a root. Validation walks this chain, checks each signature, confirms dates are valid, verifies the name matches the requested host, and consults revocation information. A self-signed or private CA certificate is only trusted if the client explicitly installs that CA.

## Method
1. Examine the certificate fields: subject, issuer, serial, validity, public key, and subject alternative names.
2. Build the chain from leaf through intermediates to a trusted root.
3. Verify each signature and ensure all dates are current.
4. Confirm the requested hostname matches a subject alternative name.

## Example
Inspect a lab certificate chain:
```bash
openssl x509 -in <LAB_CERT> -noout -subject -issuer -dates
openssl verify -CAfile <LAB_CA_BUNDLE> <LAB_CERT>    # <LAB> validate the chain
openssl s_client -connect <LAB_HOST>:<LAB_PORT> -showcerts
```

## Comparison
| Certificate | Role |
|---|---|
| Root | Trust anchor installed in clients |
| Intermediate | Delegates signing, limits root exposure |
| Leaf | Presented by the server for its hostname |

## Common mistakes
- Forgetting to send intermediate certificates, leaving the client unable to build the chain.
- Relying on the deprecated common name instead of subject alternative names.
- Treating an expired certificate as a minor issue; clients correctly reject it.

## Defense / verification
Use `openssl verify` with your lab CA bundle and confirm hostname coverage. Monitor expiration dates and automate renewal to avoid outages.

## Knowledge check
Q: Why do servers send intermediate certificates along with the leaf?
A: So clients can build a complete chain to a trusted root they already know.

===MODULE===
TITLE: The TLS Handshake
LEVEL: Advanced
MINUTES: 45
SUMMARY: Follow the TLS 1.2 handshake step by step, from ClientHello and certificate validation through key exchange and Finished messages.
OBJECTIVES: Trace the handshake message sequence | Explain cipher-suite negotiation | Describe the change to encrypted records
TAKEAWAYS: The handshake negotiates parameters and authenticates the server | The premaster secret derives session keys | Finished messages verify the handshake was not tampered with
PRACTICE: In your lab, capture a TLS handshake and identify each message from ClientHello to Finished.
SOURCES: None
---
## Core idea
The TLS handshake establishes a secure session before application data is sent. The mental model: two strangers agree on a shared language, exchange credentials, and then switch to a private code. In TLS 1.2, the client sends a ClientHello listing supported versions, cipher suites, and a random value. The server replies with ServerHello, its certificate, and key-exchange parameters, then ends its hello messages. The client validates the certificate, generates a premaster secret, encrypts it to the server's public key (or performs Diffie-Hellman), and both derive identical session keys. ChangeCipherSpec signals the switch to encrypted records, and Finished messages confirm integrity.

## Method
1. Read the ClientHello: version, random, cipher suites, extensions such as SNI and ALPN.
2. Read the ServerHello: chosen cipher suite and server random.
3. Follow certificate validation and key exchange (RSA or ECDHE).
4. Observe ChangeCipherSpec and the encrypted Finished messages.

## Example
Generate and inspect a lab handshake:
```bash
openssl s_client -connect <LAB_HOST>:<LAB_PORT> -tls1_2 -msg < /dev/null
sudo tcpdump -i <LAB_IFACE> 'tcp port <LAB_PORT>' -c 20   # <LAB> capture the exchange
```

## Comparison
| Phase | Messages |
|---|---|
| Negotiation | ClientHello, ServerHello |
| Authentication | Certificate, ServerKeyExchange |
| Key establishment | ClientKeyExchange |
| Switch to encryption | ChangeCipherSpec, Finished |

## Common mistakes
- Assuming the certificate itself encrypts application data; it only carries the public key.
- Ignoring Server Name Indication, which lets a server choose the right certificate for a hostname.
- Treating a handshake failure as always a certificate problem; cipher mismatch is common.

## Defense / verification
Capture the handshake in your lab and verify the chosen cipher suite and certificate chain. Use `openssl s_client` to reproduce failures with verbose messages.

## Knowledge check
Q: Which extension lets a client tell a server which hostname it is connecting to?
A: Server Name Indication (SNI).

===MODULE===
TITLE: TLS 1.3 and Session Resumption
LEVEL: Advanced
MINUTES: 45
SUMMARY: Learn how TLS 1.3 simplifies the handshake, removes obsolete algorithms, and speeds up repeat connections with resumption and 0-RTT.
OBJECTIVES: Contrast TLS 1.3 with TLS 1.2 | Explain 1-RTT and 0-RTT | Understand resumption tickets and PSKs
TAKEAWAYS: TLS 1.3 removes RSA key transport and mandates forward secrecy | The handshake is shorter and mostly encrypted | Resumption uses PSKs from tickets
PRACTICE: In your lab, connect with openssl using TLS 1.3 and compare the handshake message count with TLS 1.2.
SOURCES: None
---
## Core idea
TLS 1.3 redesigns the handshake for speed and security. The mental model: TLS 1.2 negotiated everything in a long public conversation; TLS 1.3 folds most parameters into the initial messages and encrypts them almost immediately. Obsolete algorithms such as RSA key transport, static Diffie-Hellman, CBC ciphers, and SHA-1 signatures are removed, and all key exchange is ephemeral for forward secrecy. A full handshake completes in one round trip (1-RTT). For repeat connections, the server issues a session ticket containing a pre-shared key; the client can resume in 1-RTT or even send early data in 0-RTT, at the cost of weaker replay protection for that early data.

## Method
1. Compare message flows: TLS 1.2 requires more round trips than TLS 1.3.
2. Note that most TLS 1.3 handshake messages after ServerHello are encrypted.
3. Understand that resumption uses a PSK from a NewSessionTicket rather than renegotiation.
4. Weigh 0-RTT's latency benefit against replay risk for non-idempotent requests.

## Example
Compare protocol versions in the lab:
```bash
openssl s_client -connect <LAB_HOST>:<LAB_PORT> -tls1_3 -msg < /dev/null
openssl s_client -connect <LAB_HOST>:<LAB_PORT> -tls1_2 -msg < /dev/null
# <LAB> compare message counts on your own test server
```

## Comparison
| Feature | TLS 1.2 | TLS 1.3 |
|---|---|---|
| Handshake | 2-RTT typical | 1-RTT typical |
| Key exchange | RSA or DH | Ephemeral DH only |
| Obsolete ciphers | Allowed | Removed |
| Resumption | Session IDs/tickets | PSK tickets |

## Common mistakes
- Enabling 0-RTT for state-changing operations without replay protection.
- Assuming TLS 1.3 still supports renegotiation; it was removed.
- Forgetting that middleboxes may block unknown TLS 1.3 record content types.

## Defense / verification
Use `openssl s_client` to confirm the negotiated protocol and cipher. In your lab, test resumption by inspecting ticket reuse and verify that applications do not send sensitive state-changing data as early data.

## Knowledge check
Q: What security tradeoff does 0-RTT early data introduce?
A: It is replayable, so an attacker can resend the early data.

===MODULE===
TITLE: Forward and Reverse Proxies
LEVEL: Intermediate
MINUTES: 40
SUMMARY: Understand how proxy servers mediate client traffic, distinguishing forward proxies for clients from reverse proxies for servers.
OBJECTIVES: Explain forward and reverse proxy roles | Identify common use cases | Recognize proxy header effects
TAKEAWAYS: A forward proxy acts on behalf of clients | A reverse proxy acts on behalf of servers | Both can cache, filter, and hide addresses
PRACTICE: In your lab, configure a simple forward proxy for a test client and a reverse proxy in front of a local web service, then inspect headers.
SOURCES: None
---
## Core idea
A proxy is an intermediary that terminates one connection and creates another. The mental model: a forward proxy is a personal assistant who makes requests on your behalf, while a reverse proxy is a receptionist who receives all visitors and routes them to the right back-end office. Forward proxies sit near clients and are used for caching, access control, and anonymity within an organization. Reverse proxies sit near servers and provide load balancing, TLS termination, caching, and hiding of back-end topology. Because the proxy originates the second connection, the back end sees the proxy's address unless headers such as X-Forwarded-For preserve client information.

## Method
1. Determine which side the proxy represents: clients (forward) or servers (reverse).
2. Identify the functions it performs: caching, filtering, TLS termination, or load balancing.
3. Check how client identity is propagated with forwarding headers.
4. Verify that trust boundaries account for headers that clients could spoof.

## Example
Inspect proxy behavior in the lab:
```bash
curl -x <LAB_PROXY> http://<LAB_TARGET>/        # <LAB> use a forward proxy
curl http://<LAB_REVERSE_PROXY>/                # <LAB> reach a service via reverse proxy
sudo tcpdump -i <LAB_IFACE> 'tcp port <LAB_PORT>' -c 10
```

## Comparison
| Aspect | Forward proxy | Reverse proxy |
|---|---|---|
| Acts for | Clients | Servers |
| Typical location | Client network edge | Server network edge |
| Common use | Caching, access control | TLS termination, load balancing |

## Common mistakes
- Trusting X-Forwarded-For from an untrusted client without sanitizing it.
- Assuming end-to-end TLS exists when the proxy terminates TLS and re-encrypts or forwards in cleartext.
- Forgetting that proxies change source addresses in server logs.

## Defense / verification
Confirm which headers your proxy strips or adds, and log the real client IP from a trusted header chain. In your lab, verify that direct back-end access is blocked so the proxy cannot be bypassed.

## Knowledge check
Q: Which kind of proxy terminates TLS for a web service and balances requests among back-end servers?
A: A reverse proxy.

===MODULE===
TITLE: CDNs and Load Balancers
LEVEL: Intermediate
MINUTES: 40
SUMMARY: Learn how content delivery networks and load balancers distribute traffic, improve latency, and increase availability.
OBJECTIVES: Explain CDN edge delivery | Compare L4 and L7 load balancing | Describe health checks and persistence
TAKEAWAYS: CDNs cache content close to users | Layer 4 balances by connection, Layer 7 by request content | Health checks remove failing back ends
PRACTICE: In your lab, place a load balancer in front of two local web servers and verify request distribution and failover.
SOURCES: None
---
## Core idea
CDNs and load balancers solve scale and availability problems by spreading work across many machines. The mental model: a CDN is a chain of local warehouses that stock popular goods near customers, while a load balancer is a dispatcher that hands incoming jobs to whichever worker is healthy and available. CDNs cache static content at edge sites close to users, reducing latency and origin load. Load balancers operate at Layer 4 (distributing TCP connections) or Layer 7 (routing based on HTTP headers, paths, or cookies). Health checks periodically test back ends and remove failing ones; persistence or sticky sessions keep a user pinned to one back end when required.

## Method
1. Identify what is being distributed: cached content (CDN) or live requests (load balancer).
2. Choose Layer 4 for simple throughput or Layer 7 for content-aware routing.
3. Configure health checks with sensible intervals and thresholds.
4. Decide whether session persistence is needed or whether sessions should be externalized.

## Example
Verify lab distribution:
```bash
for i in 1 2 3 4; do curl -s <LAB_LB_URL>/whoami; done   # <LAB> observe alternating back ends
curl -I <LAB_CDN_URL>/<LAB_OBJECT>                      # <LAB> inspect cache headers
```

## Comparison
| Aspect | Layer 4 LB | Layer 7 LB |
|---|---|---|
| Decision basis | IP and port | URL, headers, cookies |
| TLS termination | Usually no | Usually yes |
| Flexibility | Low | High |

## Common mistakes
- Depending on sticky sessions when a shared session store would be more resilient.
- Setting health checks too aggressive so transient delays remove healthy servers.
- Assuming CDN caching applies to personalized responses without proper cache keys.

## Defense / verification
Confirm distribution with repeated requests and watch back-end logs. Test failover by stopping one lab back end and verifying traffic shifts entirely to the healthy node.

## Knowledge check
Q: Which layer does a load balancer use when routing by URL path?
A: Layer 7 (application layer).

===MODULE===
TITLE: Wireshark Capture and Display Filters
LEVEL: Intermediate
MINUTES: 40
SUMMARY: Learn to capture packets safely on an owned network and use Wireshark display filters to isolate relevant conversations.
OBJECTIVES: Choose a capture interface and snaplen | Use capture and display filters | Follow streams and interpret coloring
TAKEAWAYS: Capture filters use BPF syntax before capture | Display filters use Wireshark syntax after capture | Follow TCP stream reconstructs a conversation
PRACTICE: In your lab, capture a short session and build display filters isolating one host's DNS and TCP traffic.
SOURCES: None
---
## Core idea
Wireshark turns raw frames into readable protocol trees. The mental model: a capture is a crime scene and filters are your search warrants — capture filters decide what to record, while display filters decide what to show. Capture filters use BPF syntax and cannot be widened later, so keep them broad. Display filters use Wireshark's own language and can be changed freely. Useful primitives include `ip.addr`, `tcp.port`, `udp.port`, `dns`, `http`, and `frame.contains`. Right-click a packet and use Follow TCP Stream to reassemble a conversation, and use coloring rules to spot protocols quickly.

## Method
1. Select the correct interface and set a sensible snaplen; use promiscuous mode only on your own lab segment.
2. Apply a broad capture filter such as `host <LAB_IP>`.
3. Narrow with display filters like `dns || tcp.port == <LAB_PORT>`.
4. Follow streams and inspect protocol fields in the detail pane.

## Example
Commands and filters for the lab:
```bash
dumpcap -i <LAB_IFACE> -w <LAB_CAPTURE>.pcapng -f "host <LAB_IP>"
# <LAB> choose an interface on your own lab segment
```
```
Display filters:
  ip.addr == <LAB_IP>
  dns && ip.src == <LAB_CLIENT>
  tcp.flags.syn == 1 && tcp.flags.ack == 0
```

## Comparison
| Filter type | Syntax | When applied |
|---|---|---|
| Capture filter | BPF (e.g., `tcp port 443`) | Before recording |
| Display filter | Wireshark (e.g., `tcp.port == 443`) | After recording |

## Common mistakes
- Using display-filter syntax in the capture box, which captures nothing.
- Capturing on the wrong interface and seeing no traffic.
- Leaving a capture running too long and filling the disk with irrelevant packets.

## Defense / verification
Start with a broad capture, then refine display filters iteratively. Check packet counts and timestamps to confirm the capture covers the event of interest.

## Knowledge check
Q: Which filter syntax does a Wireshark capture filter use?
A: BPF (Berkeley Packet Filter) syntax.

===MODULE===
TITLE: tcpdump and Berkeley Packet Filter Syntax
LEVEL: Intermediate
MINUTES: 40
SUMMARY: Learn to capture packets from the command line with tcpdump and build precise BPF expressions for hosts, networks, ports, and protocols.
OBJECTIVES: Write BPF primitives and qualifiers | Save and read capture files | Combine expressions with logical operators
TAKEAWAYS: BPF uses type, direction, and protocol qualifiers | Save with -w and read with -r | Parentheses control precedence
PRACTICE: On your lab host, capture traffic matching one host and one port, save it to a file, and read it back with a refined filter.
SOURCES: None
---
## Core idea
tcpdump is the command-line packet capture workhorse, and BPF expressions let you select exactly the traffic you want. The mental model: a BPF expression is a sentence with qualifiers — type (host, net, port), direction (src, dst), and protocol (tcp, udp, icmp, arp) — joined by `and`, `or`, and `not`. Captures should be performed only on networks you own or are explicitly authorized to test. tcpdump writes standard pcap files that Wireshark can open, making it useful for headless servers and automation.

## Method
1. Choose an interface with -i and decide whether to resolve names (-n avoids DNS noise).
2. Build the BPF expression from type, direction, and protocol qualifiers.
3. Limit packet count with -c and save with -w to avoid runaway files.
4. Read back with -r and refine the filter as needed.

## Example
Capture and review lab traffic:
```bash
sudo tcpdump -i <LAB_IFACE> -nn -c 20 'host <LAB_IP> and tcp port <LAB_PORT>' -w <LAB_FILE>.pcap
tcpdump -nn -r <LAB_FILE>.pcap 'src port 53 or dst port 53'
# <LAB> substitute your own host and port values
```

## Comparison
| Qualifier | Example | Selects |
|---|---|---|
| Type | `host 192.168.1.10` | A single host |
| Direction | `src net 10.0.0.0/8` | Source network |
| Protocol | `icmp` | ICMP packets only |

## Common mistakes
- Forgetting `-n`, which triggers reverse DNS lookups that pollute the capture.
- Using shell quotes incorrectly so the shell expands special characters before tcpdump sees them.
- Assuming a filter can be broadened after the capture; use -w for a broad capture instead.

## Defense / verification
Confirm the interface and filter with a short `-c` capture before a long run. Check the file with `tcpdump -r` and verify timestamps and packet counts match the event window.

## Knowledge check
Q: What does the `-n` flag do in tcpdump?
A: It disables name resolution, showing numeric addresses and ports.

===MODULE===
TITLE: Packet Dissection: Reading a Frame From Bytes to Application
LEVEL: Intermediate
MINUTES: 40
SUMMARY: Practice reading a captured frame layer by layer, from the Ethernet header through IP and TCP to the application payload.
OBJECTIVES: Decode nested headers | Locate addresses, ports, and flags | Correlate fields across layers
TAKEAWAYS: Each layer's header points to the next | Offsets and length fields bound each header | Checksums verify integrity at their layer
PRACTICE: In your lab, open one captured HTTP frame in Wireshark and annotate every field from Ethernet through HTTP.
SOURCES: None
---
## Core idea
Packet dissection means reading a frame as a stack of nested headers. The mental model: each protocol header is a labeled box that contains a smaller box; the EtherType says what is inside the frame, the IP protocol field says what is inside the packet, and the port numbers say which application waits inside the segment. Starting from the outer Ethernet header, you read destination and source MAC, then IPv4 version, TTL, and addresses, then TCP ports, flags, sequence number, and finally the application bytes. Length and offset fields tell you where each header begins and ends, and checksums let you judge whether the bytes were corrupted in transit.

## Method
1. Read the Ethernet header: MACs and EtherType (0x0800 for IPv4).
2. Read the IP header: version, IHL, total length, TTL, protocol (6 for TCP), and addresses.
3. Read the TCP header: ports, sequence, acknowledgment, data offset, flags, and window.
4. Read the application payload and note how its length relates to IP total length minus header sizes.

## Example
Dissect a lab frame from the command line:
```bash
sudo tcpdump -i <LAB_IFACE> -nn -vvv -c 1 'tcp port <LAB_PORT>'
tshark -r <LAB_CAPTURE>.pcapng -T fields -e ip.src -e ip.dst -e tcp.flags
# <LAB> annotate each header field from your own capture
```

## Comparison
| Layer | Key fields | Next layer pointer |
|---|---|---|
| Ethernet | MAC addresses | EtherType |
| IPv4 | Addresses, TTL | Protocol field |
| TCP | Ports, flags | Destination port |

## Common mistakes
- Assuming header sizes are fixed; IP and TCP options change lengths.
- Confusing the frame length with the IP total length, which excludes the Ethernet header.
- Ignoring VLAN tags that add four bytes before the EtherType.

## Defense / verification
Cross-check your manual reading with Wireshark's protocol tree. In the lab, verify that computed payload lengths match the bytes shown; mismatches suggest truncation or capture snaplen issues.

## Knowledge check
Q: Which IP header field indicates that the payload is TCP?
A: The Protocol field, with value 6.

===MODULE===
TITLE: Flow and Conversation Analysis
LEVEL: Intermediate
MINUTES: 40
SUMMARY: Learn to group packets into flows and conversations, reconstruct sessions, and reason about who talked to whom and when.
OBJECTIVES: Define a flow by its five-tuple | Use conversation statistics | Reconstruct a TCP stream
TAKEAWAYS: A flow is identified by protocol, both addresses, and both ports | Conversations reveal endpoints and volume | Streams reassemble ordered payload bytes
PRACTICE: In your lab, open a capture, list conversations, and follow one TCP stream to recover the exchanged text.
SOURCES: None
---
## Core idea
Individual packets are rarely meaningful alone; grouping them into flows turns noise into a story. The mental model: packets are individual sentences, a flow is one phone call, and conversation analysis is the call log showing who called whom, for how long, and how much was said. A flow is usually defined by a five-tuple: protocol, source IP, source port, destination IP, and destination port. Wireshark's Conversations window aggregates packets by these tuples and by MAC addresses, letting you find the loudest talkers. Follow TCP Stream reassembles the byte stream in sequence order, making application data readable even across many packets.

## Method
1. Open Statistics > Conversations and sort by packets or bytes.
2. Identify the most significant endpoints and protocols.
3. Apply a display filter for one conversation and follow the TCP stream.
4. Note timing gaps and retransmissions that explain application behavior.

## Example
List and extract flows in the lab:
```bash
tshark -r <LAB_CAPTURE>.pcapng -q -z conv,tcp
tshark -r <LAB_CAPTURE>.pcapng -Y 'ip.addr == <LAB_IP>' -q -z follow,tcp,ascii,0
# <LAB> use a capture taken on your own lab segment
```

## Comparison
| View | Granularity | Best for |
|---|---|---|
| Packet list | Single frame | Header details |
| Conversations | Five-tuple pair | Who talked to whom |
| Follow stream | One session | Application content |

## Common mistakes
- Treating each TCP packet as an independent request; most are parts of one stream.
- Ignoring that NAT can make one internal host appear as several flows.
- Forgetting that UDP has no stream, so "following" it only shows datagrams in order.

## Defense / verification
Verify conversation endpoints against asset inventories in your lab. Confirm that unusual high-volume flows correspond to legitimate transfers rather than capture artifacts.

## Knowledge check
Q: What five values typically define a TCP flow?
A: Protocol, source IP, source port, destination IP, and destination port.

===MODULE===
TITLE: Protocol Statistics and Hierarchical Traffic Views
LEVEL: Advanced
MINUTES: 40
SUMMARY: Use protocol hierarchy, endpoint, and I/O statistics to summarize a capture and spot what dominates network traffic.
OBJECTIVES: Read the protocol hierarchy | Identify top endpoints | Interpret I/O and round-trip graphs
TAKEAWAYS: Protocol hierarchy shows percentage breakdown by layer | Endpoint lists reveal chatty hosts | Graphs expose timing patterns and stalls
PRACTICE: In your lab, open a long capture and use protocol hierarchy and I/O graphs to identify the busiest protocol and host.
SOURCES: None
---
## Core idea
Summarizing a capture before reading individual packets saves time. The mental model: the protocol hierarchy is a pie chart of the whole conversation, endpoint lists are a leaderboard of participants, and I/O graphs are a timeline showing when activity spiked or stalled. Wireshark's Protocol Hierarchy shows how packets distribute across layers and protocols as percentages, which immediately reveals whether DNS, TLS, or bulk transfers dominate. Endpoint statistics list hosts by packets and bytes, helping you find scanners or backup jobs. I/O graphs plot packet rates over time and can reveal periodic beaconing or retransmission bursts.

## Method
1. Open Statistics > Protocol Hierarchy and note the dominant protocols.
2. Open Statistics > Endpoints and sort by bytes to find top talkers.
3. Generate an I/O graph and adjust the interval to see bursts and gaps.
4. Use round-trip time graphs to detect latency or retransmission patterns in TCP streams.

## Example
Generate summaries in the lab:
```bash
tshark -r <LAB_CAPTURE>.pcapng -q -z io,phs
tshark -r <LAB_CAPTURE>.pcapng -q -z endpoints,ip
# <LAB> summarize a capture from your own lab network
```

## Comparison
| View | Answers |
|---|---|
| Protocol hierarchy | What protocols are present |
| Endpoints | Which hosts are busiest |
| I/O graph | When traffic changed |

## Common mistakes
- Drawing conclusions from a short capture that misses daily patterns.
- Confusing bytes with packets; a few large transfers can dominate bytes while many small chats dominate packets.
- Ignoring encrypted traffic that appears only as TLS on a high port.

## Defense / verification
Cross-check summaries against interface counters and server logs. In your lab, generate a known bulk transfer and confirm it appears as expected in the hierarchy and endpoints.

## Knowledge check
Q: Which Wireshark view shows the percentage breakdown of protocols by layer?
A: Protocol Hierarchy.

===MODULE===
TITLE: Traffic Baselining and Anomaly Spotting
LEVEL: Advanced
MINUTES: 45
SUMMARY: Learn to build a baseline of normal network behavior and recognize deviations such as unusual protocols, volumes, timings, or destinations.
OBJECTIVES: Define a baseline and its dimensions | Compare current traffic to normal | Prioritize suspicious deviations
TAKEAWAYS: Baselines describe normal by host, protocol, volume, and time | Anomalies are deviations from that baseline | Context prevents false positives
PRACTICE: In your lab, collect a week-like sample of normal traffic, then introduce a controlled anomaly and identify it in summaries.
SOURCES: None
---
## Core idea
A baseline is a documented picture of normal network behavior. The mental model: you cannot recognize strange behavior until you know what ordinary looks like, just as a guard learns the usual routine before noticing a stranger. Baselines are built across dimensions: which hosts communicate, which protocols they use, typical byte and packet volumes, common destinations, and normal time-of-day patterns. Anomalies are deviations — a host using a new protocol, a sudden volume spike, connections at odd hours, or traffic to unfamiliar external addresses. Context matters: a backup window legitimately spikes traffic, so correlate changes with schedules and asset roles.

## Method
1. Collect representative traffic over enough time to capture normal cycles.
2. Summarize by protocol, endpoint, volume, and time using statistics views or NetFlow.
3. Record expected patterns for critical hosts and services.
4. Compare new captures to the baseline and investigate deviations with targeted filters.

## Example
Compare baselines in the lab:
```bash
tshark -r <LAB_BASELINE> -q -z endpoints,ip
tshark -r <LAB_TODAY> -q -z endpoints,ip
# <LAB> compare endpoint byte counts and investigate new destinations
```

## Comparison
| Dimension | Normal example | Suspicious deviation |
|---|---|---|
| Protocol | DNS, HTTPS | Rare protocol from a workstation |
| Volume | Steady backups at night | Sudden sustained upload midday |
| Timing | Business hours | Repeated connections at 03:00 |

## Common mistakes
- Treating every deviation as malicious without checking legitimate changes.
- Building a baseline during an incident and enshrining abnormal behavior.
- Ignoring encryption, which hides payload but not metadata such as timing and volume.

## Defense / verification
Validate anomalies with a second data source such as logs or flow records. In your lab, document the controlled anomaly you introduced and confirm your baseline comparison would have flagged it.

## Knowledge check
Q: Why must context accompany a baseline comparison?
A: Because legitimate scheduled activity can look anomalous without knowing the schedule and host role.

===MODULE===
TITLE: Authorized Lab Attack Patterns: Scanning and Sniffing
LEVEL: Advanced
MINUTES: 45
SUMMARY: Understand common reconnaissance techniques — port scanning and packet sniffing — strictly within an owned lab or an explicitly in-scope engagement.
OBJECTIVES: Explain how port scans reveal open services | Describe passive sniffing | Observe both in a lab capture
TAKEAWAYS: All offensive steps here are lab-only or in-scope | Scanning maps services, sniffing observes traffic | Each technique has a defensive counterpart
PRACTICE: In your isolated lab, scan a host you own with a connector tool and capture the resulting traffic, then verify your IDS notices it.
SOURCES: None
---
## Core idea
Understanding offensive techniques is essential for defense, but they must only be used on networks you own or engagements with written authorization. This module covers two lab-only patterns. Port scanning sends probes to many ports to learn which services are listening; a SYN scan sends a SYN and interprets the response without completing a connection. Sniffing passively captures traffic visible on a segment, revealing protocols and metadata. The mental model: scanning knocks on doors, sniffing listens in the hallway. Both are routine for an authorized defender testing their own environment and produce distinctive traffic that detection systems can identify.

## Method
1. Confirm scope and authorization before any probing; in this lab, the target is a host you own.
2. Use a lab-only connector to enumerate open ports and record the responses.
3. Capture the probing traffic to see SYN, RST, and ICMP unreachable patterns.
4. Separately, sniff your lab segment to inventory protocols and compare against the baseline.

## Example
Lab-only exercise on your own hosts:
```bash
nc -vz <LAB_TARGET> 1-1024                  # <LAB> authorized scan of your own host
sudo tcpdump -i <LAB_IFACE> -nn -c 30 'tcp[tcpflags] & tcp-syn != 0'
```

## Comparison
| Technique | Active/Passive | Reveals |
|---|---|---|
| SYN scan | Active | Open, closed, filtered ports |
| Sniffing | Passive | Protocols, endpoints, volumes |

## Common mistakes
- Scanning or sniffing networks outside the authorized scope; never do this on third parties.
- Assuming a closed port means no service; filtering can hide services behind a firewall.
- Ignoring that switched networks limit what passive sniffing can see without a span port.

## Defense / verification
Verify your lab IDS or logs record the scan, then tune rules to reduce noise. Defensively, use firewall rules, port-security, and monitoring of connection rates to detect scanning on owned networks.

## Knowledge check
Q: What response typically indicates an open port during a SYN scan?
A: A SYN-ACK, which the scanner acknowledges or resets without completing the handshake.

===MODULE===
TITLE: Network Segmentation and Firewall Fundamentals
LEVEL: Advanced
MINUTES: 45
SUMMARY: Learn how VLANs, subnets, firewalls, and ACLs divide a network into trust zones and limit lateral movement.
OBJECTIVES: Design trust zones and boundaries | Write basic firewall rules | Verify segmentation in a lab
TAKEAWAYS: Segmentation limits blast radius | Default-deny is stronger than default-allow | Verify both allowed and denied paths
PRACTICE: In your lab, place a test server in a separate VLAN and write firewall rules permitting only required ports, then test allowed and blocked traffic.
SOURCES: None
---
## Core idea
Segmentation divides a network into zones so a compromise in one area does not automatically spread. The mental model: a ship with watertight compartments survives a breach better than one open hall. Boundaries are built from VLANs and subnets at Layer 2 and 3, and enforced by firewalls or access control lists that permit or deny flows between zones. A default-deny stance permits only explicitly required traffic, which reduces attack surface. Micro-segmentation applies policy down to individual workloads. Effective design requires knowing which flows are necessary, documenting them, and testing that unintended paths are actually blocked.

## Method
1. Identify assets and group them into trust zones by role and sensitivity.
2. Define the minimum flows required between zones.
3. Implement VLANs, subnets, and firewall rules that permit only those flows.
4. Test allowed traffic and verify denied traffic fails, then log and review.

## Example
Create and test a lab rule set:
```bash
sudo iptables -A FORWARD -s <LAB_LAN> -d <LAB_SERVER_NET> -p tcp --dport <LAB_PORT> -j ACCEPT
sudo iptables -A FORWARD -s <LAB_LAN> -d <LAB_SERVER_NET> -j DROP
curl --max-time 3 http://<LAB_SERVER>:<LAB_PORT>/   # <LAB> allowed path
curl --max-time 3 http://<LAB_SERVER>:<BLOCKED_PORT>/ # <LAB> must fail
```

## Comparison
| Approach | Granularity | Strength |
|---|---|---|
| Flat network | None | Weak |
| VLAN segmentation | Broadcast domain | Moderate |
| Micro-segmentation | Per workload | Strong |

## Common mistakes
- Allowing broad any-any rules that defeat segmentation.
- Forgetting return traffic and inadvertently breaking legitimate flows.
- Assuming segmentation alone replaces patching and monitoring.

## Defense / verification
Test each policy from both directions and confirm denies generate logs. Review firewall rules periodically for stale allows and document the business reason for each exception.

## Knowledge check
Q: Why is default-deny generally stronger than default-allow?
A: It only permits explicitly identified necessary traffic, so unexpected flows are blocked automatically.

===MODULE===
TITLE: Detection Engineering With IDS Signatures
LEVEL: Advanced
MINUTES: 45
SUMMARY: Learn how intrusion detection systems use signatures and anomalies to flag suspicious traffic, and how to write and tune a lab rule.
OBJECTIVES: Explain signature versus anomaly detection | Write a simple lab rule | Tune to reduce false positives
TAKEAWAYS: Signatures match known patterns | Anomaly detection flags deviations from baseline | Tuning balances coverage and noise
PRACTICE: In your lab, write an IDS rule that alerts on repeated connection attempts to a closed port, then trigger and refine it.
SOURCES: None
---
## Core idea
An IDS inspects traffic or logs and raises alerts when it sees suspicious patterns. The mental model: a signature-based IDS is a wanted-poster matcher — it recognizes known bad patterns precisely; an anomaly-based IDS is a neighborhood watch that notices unusual behavior. Signatures describe conditions such as protocol, direction, ports, payload strings, and thresholds. Good detection engineering writes rules that are specific enough to avoid false positives yet broad enough to catch variants, then tunes them against real lab traffic. Alert fatigue is a real risk, so measured coverage matters more than sheer rule count.

## Method
1. Define the behavior to detect and what evidence distinguishes it from normal traffic.
2. Write a rule with appropriate header and content matches and a threshold.
3. Test the rule with an authorized lab trigger and confirm it fires.
4. Tune by adding exclusions or adjusting thresholds, then retest.

## Example
Lab-only rule example:
```
alert tcp <LAB_LAN> any -> <LAB_TARGET> any \
  (flags:S; threshold: type threshold, track by_src, count 20, seconds 10; \
   msg:" LAB scan-like SYN rate "; sid:1000001; rev:1;)
```
```bash
sudo snort -c <LAB_CONF> -i <LAB_IFACE>     # <LAB> run in your test environment
```

## Comparison
| Detection type | Strength | Weakness |
|---|---|---|
| Signature | Precise on known patterns | Misses new variants |
| Anomaly | Can spot unknown behavior | Higher false positives |

## Common mistakes
- Alerting on single packets when a rate threshold is what matters.
- Ignoring baseline traffic, producing constant false alarms.
- Deploying rules without testing them against an authorized trigger.

## Defense / verification
Verify the rule fires on the controlled lab trigger and stays quiet under normal load. Track false-positive rates and document each rule's intent and owner.

## Knowledge check
Q: What does a threshold clause with `track by_src` accomplish?
A: It counts matching events per source address over a time window before alerting.

===MODULE===
TITLE: Logging, NetFlow, and Network Telemetry
LEVEL: Advanced
MINUTES: 45
SUMMARY: Learn what network devices log, how flow records summarize conversations, and how telemetry supports detection and investigation.
OBJECTIVES: Identify useful log sources | Read a NetFlow record | Correlate logs with captures
TAKEAWAYS: Logs record events, flows record conversations | NetFlow gives metadata without full payloads | Centralized time-synced data enables correlation
PRACTICE: In your lab, export flow records from a router or host and correlate one conversation with a packet capture and firewall log.
SOURCES: None
---
## Core idea
Telemetry is the evidence network defenders rely on after an event. The mental model: packet captures are video footage, logs are witness statements, and flow records are the traffic camera log — each gives a different view. Device logs record events such as interface changes, firewall denies, and authentication attempts. NetFlow or IPFIX summarizes conversations with fields such as source and destination, ports, protocol, bytes, packets, start and end time, and direction, without storing payloads. This makes flows scalable for long-term retention. Centralized collection with synchronized time (NTP) lets you correlate a flow, a firewall log, and a capture into one timeline.

## Method
1. Identify sources: routers, switches, firewalls, servers, and DHCP or DNS logs.
2. Export flows with NetFlow/IPFIX and ensure devices use a consistent time source.
3. Query flows by endpoint, port, and time window to find candidate conversations.
4. Correlate with device logs and targeted packet captures.

## Example
Inspect lab telemetry:
```bash
ipflow -r <LAB_FLOW_FILE>          # <LAB> read exported flow records (if available)
journalctl -u <LAB_SERVICE> --since "1 hour ago"   # <LAB> review host logs
```

## Comparison
| Source | Detail | Retention |
|---|---|---|
| Packet capture | Full packets | Short |
| NetFlow/IPFIX | Conversation metadata | Long |
| Device logs | Events | Long |

## Common mistakes
- Assuming flows contain payloads; they carry metadata only.
- Ignoring clock skew, which breaks correlation across devices.
- Collecting logs without reviewing them, so evidence ages out unnoticed.

## Defense / verification
Confirm NTP synchronization across devices and verify flow exports arrive in the collector. In your lab, reconstruct one conversation from flow data and validate it against a capture.

## Knowledge check
Q: What key advantage does NetFlow offer over full packet capture?
A: It records conversation metadata at far lower storage cost, enabling long retention.

===MODULE===
TITLE: Capstone: Full Network Investigation in a Lab
LEVEL: Advanced
MINUTES: 60
SUMMARY: Integrate addressing, routing, DNS, TLS, capture analysis, and detection skills to investigate a simulated incident in your own lab.
OBJECTIVES: Scope and plan an investigation | Collect and correlate evidence | Report findings with confidence levels
TAKEAWAYS: Start with a hypothesis and verify it with multiple sources | Timeline construction reveals cause and effect | Document uncertainty explicitly
PRACTICE: In your isolated lab, stage a simulated service failure, then investigate using captures, flows, logs, and configuration checks and write a short report.
SOURCES: None
---
## Core idea
A real investigation combines every skill in this curriculum. The mental model: you are a detective reconstructing a timeline from several imperfect witnesses. Start by defining the question and scope, then collect evidence — configuration state, routing and DNS behavior, packet captures, flow records, and logs. Build a timeline of events and test a hypothesis against each source. A conclusion is only as strong as the evidence behind it, so state confidence levels and open questions. Everything here is performed in your own lab or an explicitly authorized engagement; no step targets third-party systems.

## Method
1. Define the question: what failed, for whom, and when?
2. Snapshot current state with `ip addr`, `ip route`, `dig`, and `ss`.
3. Collect captures and flows around the event window, then correlate with logs.
4. Build a timeline, test the leading hypothesis, and document alternatives.

## Example
Lab investigation workflow:
```bash
ip addr show <LAB_IFACE>; ip route get <LAB_TARGET>
dig <LAB_NAME> A
sudo tcpdump -i <LAB_IFACE> -nn -w <LAB_CASE>.pcap &
tshark -r <LAB_CASE>.pcap -q -z conv,tcp
# <LAB> perform all steps on your own isolated lab network
```

## Comparison
| Evidence | Confirms |
|---|---|
| Config snapshot | Intended state |
| Capture | On-the-wire behavior |
| Logs | Device and application events |

## Common mistakes
- Fixing symptoms before preserving evidence.
- Relying on a single source when correlation is available.
- Overstating certainty when data is incomplete.

## Defense / verification
Have a peer review your report and challenge the conclusion with alternate explanations. Verify that the corrective action actually resolves the simulated failure in your lab and does not introduce new issues.

## Knowledge check
Q: Why build a timeline during an investigation?
A: It establishes ordering so causes can be distinguished from coincidental events.

===MODULE===
TITLE: Mastery Checklist and the Path Ahead
LEVEL: Advanced
MINUTES: 30
SUMMARY: Consolidate the full curriculum into a self-assessment checklist and outline the next specializations for continued learning.
OBJECTIVES: Self-assess each domain | Identify weak areas to revisit | Plan the next learning steps
TAKEAWAYS: Mastery means explaining and verifying, not just recognizing | Revisit weak areas with deliberate lab practice | Networking is a foundation for security, cloud, and SRE paths
PRACTICE: In your lab, pick your three weakest checklist items and design a small exercise that proves each one, then re-test yourself.
SOURCES: None
---
## Core idea
Mastery is the ability to explain a concept, predict behavior, and verify it with evidence. The mental model: this curriculum is a map, and the checklist tells you which roads you have actually traveled. Work through each domain honestly: can you derive a subnet, trace a handshake, read a capture, and design segmentation without notes? Where you hesitate, return to the relevant module and run the lab exercise again. Networking is a foundation, not a destination; the natural next paths are defensive security operations, cloud networking, wireless, or site reliability engineering.

## Method
1. Rate each domain as recall, apply, or teach — the last being true mastery.
2. List the modules where you could only recall, and schedule deliberate practice.
3. Re-run the associated lab exercise and retest without notes.
4. Choose a specialization and build a project that combines several domains.

## Example
Self-assessment checklist for the lab notebook:
```
[ ] Binary, masks, and VLSM by hand
[ ] ARP/NDP and DHCP/DORA flows
[ ] TCP handshake, states, and retransmission
[ ] DNS hierarchy, records, caching, DNSSEC
[ ] TLS chain, handshake, proxies, CDNs
[ ] Wireshark/tcpdump filters and flow analysis
[ ] Segmentation, IDS rules, and telemetry
[ ] <LAB> notebook entry proving each item with command output
```

## Comparison
| Level | Meaning |
|---|---|
| Recall | I recognize the term |
| Apply | I can use it in a lab |
| Teach | I can explain and verify it |

## Common mistakes
- Mistaking familiarity for competence because a concept looks simple in text.
- Skipping verification and trusting memory alone.
- Stopping at one specialization instead of reinforcing foundations.

## Defense / verification
Keep a lab notebook with command outputs and short explanations. Revisit it after a month and re-run exercises to confirm durable understanding.

## Knowledge check
Q: What distinguishes true mastery from recall in this checklist?
A: The ability to apply the concept in a lab and teach it with verification, not just recognize the term.
