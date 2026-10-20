@section linux | Linux and Systems
@blurb Processes, signals, permissions, disks and memory, plus the "server is slow" investigation every DevOps loop includes.

### [1] Walk me through the Linux boot process.
@tags linux, boot
@hook Firmware, bootloader, kernel, initramfs, systemd (PID 1), targets and services, login.
@say
"First, the firmware, UEFI on modern machines or BIOS on older ones, runs hardware checks and finds a bootable device.

It loads the bootloader, usually GRUB, which lets you choose a kernel and passes it boot parameters.

The kernel is loaded into memory along with the initramfs, a small temporary root filesystem with the drivers needed to reach the real root disk, like storage, LVM or encryption modules. The kernel initialises hardware and memory management, then mounts the real root filesystem.

Then the kernel starts the first user-space process, PID 1, which on most distributions is systemd. systemd reads its unit files and brings the system to the default target, like multi-user or graphical, starting services in parallel based on their dependencies: networking, logging, SSH, the application services, and finally a login prompt.

Knowing this helps in troubleshooting: if the system hangs at boot, the stage tells you where to look, like GRUB config, a missing driver in the initramfs, a bad fstab entry that blocks mounting, or a failing systemd unit, which journalctl -b shows."

### [1] What are process states? Zombie vs orphan processes?
@tags processes, linux
@hook Zombie: finished, but its parent hasn't read its exit status. Orphan: still running, but its parent died, so init adopts it.
@say
"A process moves between states: running or runnable, R; interruptible sleep, S, waiting for an event like I/O or a timer; uninterruptible sleep, D, usually waiting on disk or network storage, which can't be killed until the I/O returns; stopped, T; and zombie, Z.

A zombie process has finished executing, but its entry stays in the process table because its parent hasn't called wait to collect its exit status. Zombies use no CPU or memory beyond the table entry, but a buggy parent that never reaps its children can accumulate thousands and exhaust PIDs. You can't kill a zombie, since it's already dead; you fix or restart the parent, and once the parent dies, init adopts and reaps them.

An orphan is a process that's still running after its parent has exited. It's adopted by PID 1, or a designated subreaper, which reaps it when it finishes. Orphans are normal, for example daemons are deliberately orphaned.

This matters in containers: the application often runs as PID 1, and if it doesn't reap children, zombies pile up, which is why tini or dumb-init are used as a minimal init in containers."

### [1] Explain SIGTERM, SIGKILL, SIGHUP and SIGINT. How does graceful shutdown work?
@tags signals, linux, graceful shutdown
@hook SIGTERM: please stop (catchable). SIGKILL: stop now (uncatchable). SIGHUP: reload or terminal closed. SIGINT: Ctrl+C.
@say
"Signals are asynchronous notifications sent to processes.

SIGTERM, signal 15, is the polite request to terminate. The process can catch it and shut down gracefully: stop accepting new work, finish in-flight requests, flush buffers, close connections and exit. It's the default for the kill command and what Docker and Kubernetes send first.

SIGKILL, signal 9, terminates the process immediately. It can't be caught or ignored, so there's no cleanup, which risks corrupted files, lost data or half-finished transactions. It's a last resort.

SIGINT, signal 2, is sent by Ctrl+C in a terminal, and is normally handled like a polite interrupt.

SIGHUP, signal 1, originally meant the terminal hung up. Many daemons, like Nginx, interpret it as 'reload your configuration' without restarting.

In Kubernetes, graceful shutdown works like this: the pod is marked terminating and removed from service endpoints; any preStop hook runs; the container receives SIGTERM; and after the termination grace period, 30 seconds by default, any remaining process gets SIGKILL. So applications must handle SIGTERM properly, and the shell form of a Dockerfile CMD can swallow it, because the signal goes to the shell, not the app."

### [1] How do Linux file permissions work? What does chmod 755 mean?
@tags permissions, linux, security
@hook Read 4, write 2, execute 1, for owner, group and others. 755: owner rwx, everyone else r-x.
@say
"Every file has an owner, a group, and three sets of permissions: for the owner, for members of the group, and for everyone else. Each set has read, write and execute bits. In numeric form, read is 4, write is 2 and execute is 1, added together per set.

So chmod 755 means the owner gets 7, read, write and execute; the group gets 5, read and execute; and others get 5, read and execute. That's typical for scripts and directories. 644 is typical for regular files: owner can read and write, everyone else can only read. 600 is for private files like SSH keys, which SSH actually requires.

For directories, the bits mean something slightly different: read lets you list the contents, write lets you create and delete files in it, and execute lets you enter it and access files by name.

There are also special bits: setuid on an executable makes it run with the file owner's privileges, like passwd running as root, which is a security-sensitive feature; setgid on a directory makes new files inherit the directory's group, useful for shared folders; and the sticky bit on a directory, like /tmp, means users can only delete their own files. The umask sets default permissions for new files, and chown changes ownership."

### [1] Hard links vs symbolic links? What is an inode?
@tags filesystem, inodes, links
@hook An inode holds a file's metadata and data locations. A hard link is another name for the same inode; a symlink is a small file containing a path.
@say
"An inode is the data structure that represents a file on disk: its permissions, owner, size, timestamps, link count and pointers to the data blocks, but not its name. Names live in directories, which map names to inode numbers.

A hard link is an additional directory entry pointing to the same inode. Both names are equally the file; the data is only removed when the last hard link is deleted and no process has it open. Hard links can't cross filesystems and usually can't point to directories.

A symbolic link, or soft link, is a separate small file whose content is a path to another file. It can cross filesystems and point to directories, but if the target is moved or deleted, the symlink breaks and becomes dangling.

Symlinks are everywhere in operations, like switching the current release of an app by repointing a 'current' symlink, which is an atomic way to deploy and roll back. ls -li shows inode numbers, and ls -l shows symlink targets."

### [2] df says the disk is full, but du shows much less used. What's going on?
@tags disk, troubleshooting, linux
@hook A deleted file is still held open by a process, so its space isn't freed. Find it with lsof +L1, then restart or truncate.
@say
"The classic cause is a file that has been deleted while a process still has it open. Deleting removes the directory entry, so du, which walks the directory tree, no longer counts it. But the inode and its data blocks aren't freed until the last open file handle is closed, so df, which asks the filesystem for its block usage, still counts the space. A common example is a huge log file deleted by someone while the application keeps writing to it.

To confirm, I run lsof +L1, or lsof | grep deleted, which lists open files with zero links, along with the process and size.

To fix it, I restart or reload the process holding the file, so it releases the handle; or, if I can't restart it right now, I truncate the file through the process's file descriptor in /proc, for example truncating /proc/PID/fd/N to zero, which frees the space immediately.

To prevent it, I'd use logrotate with copytruncate or a postrotate signal so apps reopen their logs, and ship logs off the box rather than letting them grow. Other causes of df and du disagreeing include files hidden underneath a mount point, and filesystem reserved blocks."

### [2] "No space left on device", but df -h shows free space. Why?
@tags disk, inodes, troubleshooting
@hook You've run out of inodes, not bytes. Millions of tiny files. Check df -i.
@say
"Every file uses an inode, and a filesystem has a fixed number of them, set when it was created on filesystems like ext4. If an application creates millions of tiny files, like session files, cache entries or mail queue files, the filesystem can run out of inodes while plenty of bytes remain. New files can't be created, and you get 'no space left on device'.

I'd confirm with df -i, which shows inode usage per filesystem. Then find where the files are, for example by counting files per directory with find and sort, often in places like /var/lib/php/sessions, /tmp or a cache directory.

The fix is to delete the unneeded files, carefully, since rm with a huge glob can fail with 'argument list too long', so I'd use find with -delete. Then fix the root cause, like adding cleanup or expiry to whatever creates them, and monitor inode usage alongside disk space. For workloads with huge numbers of small files, choosing a filesystem with dynamic inode allocation like XFS, or storing the data in a database or object store, avoids it."

### [1] What does load average mean?
@tags performance, cpu, linux
@hook The average number of tasks running or waiting over 1, 5 and 15 minutes. Compare it with the number of CPU cores, and remember it includes tasks waiting on disk.
@say
"Load average, shown by uptime or top, is three numbers: the average number of tasks that are running or waiting to run over the last 1, 5 and 15 minutes. On Linux it also includes tasks in uninterruptible sleep, usually waiting on disk or network storage I/O.

It only makes sense relative to the number of CPU cores. On a 4-core machine, a load of 4 means the CPUs are fully busy on average; 8 means tasks are queuing; 1 means plenty of headroom. Comparing the three numbers shows the trend: a 1-minute value much higher than the 15-minute value means load is rising.

Because Linux includes I/O wait, a high load with low CPU usage usually points to a storage bottleneck, slow disks or a hung network filesystem, rather than CPU. So I never interpret load alone; I check CPU utilisation, I/O wait in top or vmstat, and disk stats with iostat to see what's actually saturated."

### [2] A Linux server is slow. How do you investigate?
@tags troubleshooting, performance, use method
@hook Use the USE method: for CPU, memory, disk and network, check utilisation, saturation and errors. Start with a quick 60-second sweep.
@say
"I start by clarifying what 'slow' means, like high latency for users or a batch job taking longer, and whether anything changed recently.

Then I do a quick systematic sweep, based on the USE method: for each resource, CPU, memory, disk and network, check utilisation, saturation and errors.

uptime for load averages and trend. dmesg or journalctl -k for kernel errors, like OOM kills, disk errors or network issues. vmstat 1 for run queue length, memory, swapping and CPU split between user, system, I/O wait and steal time, which is important on cloud VMs where a noisy neighbour or burst credits can be the cause. mpstat to see if one core is pegged, which suggests a single-threaded bottleneck. pidstat or top to find which processes use CPU and memory. iostat -xz 1 for disk utilisation, queue length and latency. free -m for memory, and whether we're swapping. sar or ss for network throughput, errors and connection counts. And df -h and df -i for full disks or inodes.

Once I find the saturated resource, I drill into the responsible process: application logs, its metrics, and profiling tools like perf or language-specific profilers. And I check dependencies: often the server is fine and it's slow because the database or an external API is slow, which traces reveal."
@deep
The "first 60 seconds" checklist (from Brendan Gregg's Linux performance analysis):
```bash
uptime                 # load averages
dmesg | tail           # OOM kills, disk / network errors
vmstat 1               # r (run queue), si/so (swap), us/sy/wa/st
mpstat -P ALL 1        # per-CPU balance
pidstat 1              # per-process CPU
iostat -xz 1           # disk %util, await, queue size
free -m                # memory, buff/cache, swap
sar -n DEV 1           # network throughput
sar -n TCP,ETCP 1      # TCP connections, retransmits
top                    # overview
```

### [2] A process is using 100% CPU. How do you find out why?
@tags cpu, troubleshooting, profiling
@hook Identify the process and thread, check whether it's user or kernel time, then profile or dump the stacks to see what code is hot.
@say
"First, confirm and identify: top or htop shows the process; pressing shift-H in top, or using ps -L, shows per-thread usage, so I know whether one thread is spinning or all are busy.

Then I check whether the time is user time or system time. High user time means the application's own code is busy: an infinite loop, a heavy computation, inefficient code, or excessive garbage collection. High system time means it's making lots of system calls, which strace -c can summarise, or the kernel is busy with something like networking.

To see exactly which code is hot: perf top or perf record with flame graphs work for native code. For managed runtimes, I use their tools: jstack or async-profiler for Java, dotnet-trace and dotnet-counters for .NET, py-spy for Python, and the Node inspector for Node.js. Taking several thread dumps a few seconds apart and comparing them is a quick, effective technique.

Then I correlate with what changed: a deploy, a traffic spike, a particular input causing a pathological case, or a GC storm due to memory pressure. Mitigation could be scaling out, restarting, or rolling back while the fix is developed."

### [2] free shows almost no free memory. Is that a problem? What is the OOM killer?
@tags memory, oom, linux
@hook Linux uses spare RAM as disk cache, so look at "available", not "free". The OOM killer kills the biggest offender when memory truly runs out.
@say
"Usually it's not a problem. Linux uses otherwise idle memory for the page cache, caching file data to speed up disk reads, and it gives that memory back instantly when applications need it. So 'free' being near zero is normal. The number that matters is 'available', which estimates how much memory can be given to new applications without swapping.

Real memory pressure shows up as low available memory, significant swapping, visible in vmstat's si and so columns, rising latency, and eventually the OOM killer.

The out-of-memory killer is the kernel's last resort when it can't reclaim enough memory: it picks a process, based on an oom_score that mainly reflects how much memory it uses, adjustable with oom_score_adj, and kills it with SIGKILL. You'll see it in dmesg or the kernel journal as 'Out of memory: Killed process'.

In containers, the same happens within a cgroup's memory limit: if a container exceeds its limit, it's OOM-killed, which Kubernetes reports as OOMKilled with exit code 137. The fixes are to find out whether it's a genuine need, so raise the limit, or a leak, which needs profiling, and to set requests and limits based on measured usage."

### [1] What is systemd? How do you manage services with it?
@tags systemd, services, linux
@hook PID 1 and service manager. systemctl start, stop, enable, status; journalctl for logs; unit files define how services run.
@say
"systemd is the init system and service manager on most modern Linux distributions. It runs as PID 1, starts services in parallel based on dependencies, supervises them, restarts them on failure, and collects their logs in the journal.

Day to day: systemctl start, stop and restart control a service now; systemctl enable and disable control whether it starts at boot, so enabling doesn't start it immediately unless you add --now; systemctl status shows state, recent log lines and the main PID; and journalctl -u service-name shows its logs, with -f to follow and --since for time ranges. After editing a unit file, systemctl daemon-reload is needed.

A unit file for a custom service defines what to run with ExecStart, the user to run as, environment variables, dependencies with After and Wants, and restart behaviour, like Restart=on-failure with a delay. It can also apply resource limits and security sandboxing options, like running with no new privileges or a read-only filesystem.

systemd timers are a modern alternative to cron, with better logging and handling of missed runs."
@deep
```ini
# /etc/systemd/system/orders-api.service
[Unit]
Description=Orders API
After=network-online.target
Wants=network-online.target

[Service]
User=orders
WorkingDirectory=/opt/orders
EnvironmentFile=/etc/orders/env
ExecStart=/opt/orders/OrdersApi
Restart=on-failure
RestartSec=5
NoNewPrivileges=true
ProtectSystem=strict

[Install]
WantedBy=multi-user.target
```

### [1] Explain cron syntax. What are the common pitfalls?
@tags cron, scheduling
@hook Five fields: minute, hour, day of month, month, day of week. Pitfalls: a minimal environment, no PATH, silent failures, overlapping runs, time zones.
@say
"A crontab line has five time fields, minute, hour, day of month, month and day of week, followed by the command. For example, '30 2 * * 1-5' runs at 2:30 a.m. Monday to Friday; '*/15 * * * *' runs every 15 minutes.

The common pitfalls: cron runs with a minimal environment, so PATH and environment variables you rely on in your shell aren't set, which is why scripts work manually but fail in cron. Use absolute paths and set variables explicitly. Output and errors disappear unless redirected to a log, so failures are silent. A slow job can overlap with its next run, which flock can prevent. Time zones and daylight saving changes can skip or double runs. And there's no built-in alerting if a job stops running.

So for important jobs, I add logging, a lock, and monitoring, like a dead man's switch that alerts if the job hasn't checked in. On servers, systemd timers give better logging and handling of missed runs, and in Kubernetes, CronJobs with concurrency policies and history limits do the same job."

### [1] How does SSH key authentication work? How do you harden SSH?
@tags ssh, security, linux
@hook The server checks that you hold the private key matching an authorised public key, without the key ever leaving your machine. Harden: no root, no passwords, keys or certificates, limited access.
@say
"With key-based authentication, I generate a key pair. The public key goes into the server's authorized_keys file for my user; the private key stays on my machine, ideally protected by a passphrase or a hardware key. When I connect, after the encrypted channel is set up, the server challenges the client to prove it holds the private key, and the client responds by signing data with it. The server verifies the signature with the public key. The private key never travels over the network, which makes it much stronger than passwords and immune to password guessing.

The client also verifies the server's host key, stored in known_hosts, which protects against man-in-the-middle attacks; that's what the 'are you sure you want to continue connecting' prompt is about.

To harden SSH: disable password authentication and root login; use modern key types like Ed25519; restrict which users can log in; keep the server patched; use fail2ban or rate limiting; and don't expose SSH to the internet at all where possible, using a bastion host, a VPN, or cloud alternatives like AWS Systems Manager Session Manager or Azure Bastion. For larger fleets, SSH certificates signed by a central authority with short lifetimes beat managing authorized_keys files everywhere."

### [2] What happens when you type a command like ls -l in the shell and press Enter?
@tags shell, processes, linux
@hook The shell parses it, expands it, finds the binary through PATH, forks a child, the child execs the program, and the shell waits for it to finish.
@say
"The shell reads the line and parses it into a command and arguments, handling quoting. It performs expansions: variables, globs like star.txt, command substitution, and aliases.

Then it checks whether the command is a shell builtin, like cd or export, which run inside the shell itself; cd has to be a builtin, because a child process can't change its parent's working directory. If not, it searches the directories in the PATH variable for an executable named ls.

To run it, the shell calls fork, creating a child process that's a copy of itself. The child sets up any redirections or pipes, then calls exec, which replaces the child's program with the ls binary; the dynamic loader loads the shared libraries it needs. ls makes system calls to read the directory and file metadata, writes to standard output, which is the terminal, and exits with a status code.

Meanwhile the parent shell waits for the child, collects its exit status into the $? variable, which avoids leaving a zombie, and prints the prompt again. With a trailing ampersand, the shell doesn't wait, and the job runs in the background."

### [2] An application fails with "Too many open files". What do you do?
@tags file descriptors, ulimit, troubleshooting
@hook It hit its file descriptor limit. Check the limit and the actual count, look for a leak, then raise the limit in the right place.
@say
"Every open file, socket, pipe and connection uses a file descriptor, and each process has a limit, set by ulimit -n, often 1,024 by default. A busy server with many connections can hit it legitimately, or the application can be leaking descriptors by not closing files or connections.

First I check the process's actual limit and current usage: cat /proc/PID/limits for the limit, and ls /proc/PID/fd | wc -l, or lsof -p PID, for the current count and what the descriptors are. If most are sockets in CLOSE_WAIT, the app isn't closing connections properly, which is a leak to fix in code. If the count is steadily growing over time, it's a leak. If it's a stable but high number matching real load, the limit is just too low.

To raise it, it has to be done where the process is started: LimitNOFILE in the systemd unit file, /etc/security/limits.conf for login sessions, the ulimit settings for Docker containers, and checking the system-wide maximum in fs.file-max. Then restart the service and verify the new limit in /proc."

### [1] What are the important directories in the Linux filesystem hierarchy?
@tags filesystem, linux, basics
@hook /etc config, /var changing data and logs, /proc and /sys kernel views, /tmp temporary, /home users, /usr programs, /opt add-ons.
@say
"The main ones I work with: /etc holds system and application configuration files, like /etc/hosts, /etc/ssh/sshd_config and /etc/nginx. /var holds variable data that changes at run time: /var/log for logs, /var/lib for application state like databases and Docker data, and /var/cache. /tmp is for temporary files, often cleared on reboot. /home contains users' home directories, and /root is the root user's.

/usr contains installed programs, libraries and documentation, with /usr/bin and /usr/lib; /usr/local is for software installed manually. /opt is for self-contained third-party applications. /bin and /sbin hold essential binaries, now usually links into /usr.

/proc and /sys are virtual filesystems exposing kernel and process information, like /proc/cpuinfo, /proc/meminfo and per-process directories. /dev contains device files, /boot holds the kernel and bootloader files, and /mnt and /media are mount points.

Knowing this helps with troubleshooting and with container design, like knowing that /var/lib/docker is where images live when a disk fills up."

### [2] What is /proc, and how do you use it for troubleshooting?
@tags proc, linux, troubleshooting
@hook A live window into the kernel and every process: limits, open files, memory, environment and command line, all as readable files.
@say
"/proc is a virtual filesystem generated by the kernel on the fly; nothing in it is stored on disk. It exposes system-wide information and a directory per running process, named by its PID.

System-wide, I use /proc/cpuinfo and /proc/meminfo for hardware and memory details, /proc/loadavg, and /proc/sys, which holds tunable kernel parameters, the same ones sysctl manages, like network buffer sizes or vm.swappiness.

Per process: /proc/PID/cmdline shows the exact command and arguments; /proc/PID/environ shows the environment variables it started with, handy to confirm configuration; /proc/PID/limits shows resource limits like open files; /proc/PID/fd lists open file descriptors, with links to the actual files and sockets; /proc/PID/status shows memory usage, threads and state; and /proc/PID/cwd and exe show its working directory and binary.

It's how tools like ps, top and lsof get their data, and it's invaluable in minimal containers where those tools aren't installed: you can often still read /proc directly."

### [1] How do you keep a process running after you log out?
@tags processes, shell, linux
@hook For quick jobs: nohup, disown, or tmux. For anything that matters: make it a systemd service or a container with a restart policy.
@say
"When you log out, the shell sends SIGHUP to its jobs, which usually kills them. There are several ways around that.

nohup runs a command immune to hangups and writes its output to nohup.out, combined with an ampersand to run it in the background. disown removes a job that's already running from the shell's job table, so it won't get the hangup signal. And terminal multiplexers like tmux or screen keep a whole session alive on the server; you can detach, log out, and reattach later, which is great for long interactive tasks like a big migration.

But for anything that should keep running reliably, those are workarounds. The proper way is a systemd service, which gives automatic restarts, logging, resource limits and startup at boot, or a container with a restart policy, or a Kubernetes workload. If I see production processes started with nohup, I'd treat it as tech debt."
