@section scripting | Scripting and Automation
@blurb The bash and Python tasks that come up in screens and live rounds: safe scripts, log parsing, cleanup jobs, health checks and jq.

### [1] What does set -euo pipefail do, and why use it?
@tags bash, safety
@hook -e exits on errors, -u errors on unset variables, -o pipefail makes a pipeline fail if any part fails. Fail loudly instead of continuing in a broken state.
@say
"By default, bash keeps going after a command fails, treats unset variables as empty strings, and judges a pipeline only by its last command. That's dangerous in automation: a failed cd followed by rm -rf can delete the wrong directory, and a typo in a variable name can turn rm -rf /$DIRECTORY into rm -rf /.

set -e makes the script exit as soon as a command returns a non-zero status, with some exceptions, like commands in if conditions or followed by || true.

set -u makes referencing an unset variable an error, catching typos and missing inputs.

set -o pipefail makes a pipeline return the exit status of the last command that failed, so 'curl url | jq .' fails if curl fails, instead of succeeding because jq succeeded on empty input.

I start scripts with this line, add a trap to clean up temporary files on exit, quote all variables, and validate inputs early. I also know its quirks: set -e doesn't trigger inside some constructs, so critical commands still deserve explicit error checks, and for anything complex, I'd move to Python."
@deep
```bash
#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

tmpdir=$(mktemp -d)
trap 'rm -rf "$tmpdir"' EXIT          # always clean up

: "${TARGET_DIR:?TARGET_DIR must be set}"   # fail fast with a clear message
cd "$TARGET_DIR"                       # with -e, a failed cd stops the script
```

### [1] Find the top 10 IP addresses in a web server access log.
@tags bash, awk, log parsing
@hook awk prints the IP field, sort groups them, uniq -c counts, sort -rn ranks, head keeps the top 10.
@say
"In a standard Nginx or Apache access log, the client IP is the first field. So I'd use awk to print the first field, sort the output so identical IPs are adjacent, uniq -c to count each one, sort -rn to sort numerically in descending order, and head to keep the top ten.

For a very large file, awk can do the counting itself with an associative array in a single pass, which avoids sorting the whole file, then sort only the unique results.

Variations interviewers like: the top requested URLs, which is field 7 in the common log format; count of 5xx responses, filtering on the status field, which is field 9; requests per minute, by cutting the timestamp; or doing it on a live log with tail -f. And for logs that are rotated and compressed, zcat or zgrep across the files. In practice, with a central logging system, I'd run the equivalent query there, but knowing the pipeline matters for live troubleshooting on a box."
@deep
```bash
# Top 10 client IPs
awk '{print $1}' access.log | sort | uniq -c | sort -rn | head -10

# Same, counting in a single awk pass (faster on huge files)
awk '{c[$1]++} END {for (ip in c) print c[ip], ip}' access.log | sort -rn | head -10

# Top 10 URLs returning 5xx (combined log format: $9 = status, $7 = path)
awk '$9 ~ /^5/ {print $7}' access.log | sort | uniq -c | sort -rn | head -10

# Requests per minute
awk '{print substr($4, 2, 17)}' access.log | uniq -c | tail -20

# Across rotated, compressed logs
zcat access.log.*.gz | awk '{print $1}' | sort | uniq -c | sort -rn | head -10
```

### [1] Delete files older than seven days, safely.
@tags bash, find, cleanup
@hook find with -mtime +7 and -type f, preview first with -print, then -delete. Constrain the path and the name pattern.
@say
"I'd use find: find the directory, restricted to regular files with -type f, matching a name pattern like star.log, modified more than seven days ago with -mtime +7, and -delete.

Safety habits: always run it first with -print instead of -delete, to see exactly what would be removed; use an absolute path, validated to be non-empty, never a variable that might be empty; restrict with -name and -maxdepth so it doesn't recurse somewhere unexpected; and put -delete last, because find evaluates expressions in order, and putting -delete first would delete everything it finds.

For many files, -delete or -exec with a plus is much more efficient than piping to xargs rm, and avoids problems with spaces in file names. For logs specifically, logrotate is the better long-term tool, since it handles rotation, compression, retention and signalling the application. And I'd schedule a cleanup job with a cron job or systemd timer, logging what it deleted."
@deep
```bash
LOG_DIR="/var/log/myapp"
[[ -d "$LOG_DIR" ]] || { echo "missing $LOG_DIR" >&2; exit 1; }

# 1. Preview
find "$LOG_DIR" -maxdepth 2 -type f -name '*.log' -mtime +7 -print

# 2. Delete
find "$LOG_DIR" -maxdepth 2 -type f -name '*.log' -mtime +7 -delete

# Compress instead of delete, for files older than 1 day
find "$LOG_DIR" -type f -name '*.log' -mtime +1 -exec gzip {} +
```

### [2] Write a script that checks whether a website is up and alerts if it isn't.
@tags bash, curl, monitoring
@hook curl with a timeout, check the HTTP status, retry a few times to avoid false alarms, alert through a webhook, exit with a meaningful code.
@say
"I'd use curl with a connect and total timeout, following redirects, discarding the body, and writing out only the HTTP status code and total time. If the status isn't 200, or curl itself fails, I retry a couple of times with a short sleep, because a single failed request is often a blip. If it still fails, I send an alert, for example by posting JSON to a Slack or Teams webhook with the URL, the status and a timestamp, and exit non-zero so whatever runs the script, cron or a CI job, also sees the failure.

I'd make the URL and webhook configurable through arguments or environment variables, keep the webhook URL out of the script, and log each check.

In production, I'd rather use a proper synthetic monitoring service or blackbox exporter with Prometheus and Alertmanager, which handle scheduling, history, multiple locations and alert routing. But this kind of script is useful for quick checks, deployment smoke tests in a pipeline, and it's a common interview task to see that you handle timeouts, retries and exit codes."
@deep
```bash
#!/usr/bin/env bash
set -euo pipefail

URL="${1:?usage: check.sh <url>}"
WEBHOOK="${ALERT_WEBHOOK:?set ALERT_WEBHOOK}"
ATTEMPTS=3

for i in $(seq 1 "$ATTEMPTS"); do
  status=$(curl -sS -o /dev/null -L --connect-timeout 5 --max-time 10 \
           -w '%{http_code}' "$URL" || echo "000")
  if [[ "$status" == "200" ]]; then
    echo "$(date -Is) OK $URL"
    exit 0
  fi
  echo "$(date -Is) attempt $i: $URL returned $status" >&2
  sleep 5
done

payload=$(printf '{"text":"ALERT: %s is DOWN (last status %s) at %s"}' "$URL" "$status" "$(date -Is)")
curl -sS -X POST -H 'Content-Type: application/json' -d "$payload" "$WEBHOOK" >/dev/null
exit 1
```

### [1] Explain $?, $@ vs $*, and why quoting matters in bash.
@tags bash, variables, quoting
@hook $? is the last exit code. "$@" keeps each argument separate; $* mashes them together. Always quote variables, or spaces and globs will bite you.
@say
"$? holds the exit status of the last command: 0 means success, anything else means failure. Scripts use it to branch, though it's usually cleaner to test the command directly, like 'if grep -q pattern file'.

$@ and $* both represent all the script's or function's arguments. The difference shows when quoted: "$@" expands to each argument as a separate word, preserving arguments that contain spaces, while "$*" joins them all into a single string. So when passing arguments through to another command, "$@" is almost always what you want. Related: $# is the number of arguments, $0 is the script name, $1 onward are positional arguments, and $$ is the current process ID.

Quoting matters because unquoted variables undergo word splitting and glob expansion. If a file name contains a space, rm $file tries to delete two files; if a variable contains a star, it expands to every file in the directory. So I quote every variable expansion, "$var", unless I specifically want splitting, and use arrays for lists of arguments. Tools like ShellCheck catch these mistakes automatically, and I run it in CI for shell scripts."

### [2] When do you use Python instead of bash for automation? Give an example.
@tags python, automation, cloud sdk
@hook Bash for gluing commands together in a few lines. Python once there's logic, data structures, API calls, error handling or tests.
@say
"Bash is great for short scripts that glue command-line tools together: running a few commands, file operations and simple pipelines, especially where no extra runtime is available.

I switch to Python when the script needs real logic: parsing JSON or YAML, calling cloud or HTTP APIs, working with data structures, proper error handling and retries, concurrency, reuse across modules, or unit tests. Python scripts are more readable and maintainable as they grow, and the cloud SDKs, boto3 for AWS, the Azure SDK and the Kubernetes client, are first-class.

For example, a cost-hygiene script that finds unattached disks and stopped VMs older than 14 days without an owner tag, and reports them. In Python with boto3, it paginates through volumes in every region, filters by state and tags, builds a report, and posts it to a channel, with a dry-run mode by default and a --delete flag that requires an explicit confirmation. Doing that robustly in bash, with JSON parsing in jq, pagination and error handling, would be painful.

Practices I follow either way: idempotency, dry-run modes, logging, clear exit codes, parameters instead of hardcoded values, and running scheduled automation as a proper job in CI or Kubernetes rather than on someone's laptop."
@deep
```python
#!/usr/bin/env python3
"""Report (and optionally delete) unattached EBS volumes older than N days."""
import argparse, datetime as dt
import boto3

def unattached_volumes(region, min_age_days):
    ec2 = boto3.client("ec2", region_name=region)
    cutoff = dt.datetime.now(dt.timezone.utc) - dt.timedelta(days=min_age_days)
    paginator = ec2.get_paginator("describe_volumes")
    for page in paginator.paginate(Filters=[{"Name": "status", "Values": ["available"]}]):
        for vol in page["Volumes"]:
            tags = {t["Key"]: t["Value"] for t in vol.get("Tags", [])}
            if vol["CreateTime"] < cutoff and "keep" not in tags:
                yield ec2, vol

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--days", type=int, default=14)
    p.add_argument("--delete", action="store_true", help="actually delete (default: dry run)")
    args = p.parse_args()
    regions = [r["RegionName"] for r in boto3.client("ec2").describe_regions()["Regions"]]
    for region in regions:
        for ec2, vol in unattached_volumes(region, args.days):
            print(f"{region} {vol['VolumeId']} {vol['Size']}GiB created {vol['CreateTime']:%Y-%m-%d}")
            if args.delete:
                ec2.delete_volume(VolumeId=vol["VolumeId"])

if __name__ == "__main__":
    main()
```

### [2] How do you make automation scripts idempotent and safe to re-run?
@tags idempotency, automation, safety
@hook Check before you change, describe desired state instead of steps, make destructive actions explicit, and design for partial failure and retries.
@say
"An idempotent script produces the same end result whether it runs once or ten times, which matters because automation gets retried after failures, re-run by schedulers and run by different people.

Techniques: check the current state before acting, like creating a user, directory or resource only if it doesn't exist, and updating only if it differs; use commands and APIs that are naturally idempotent, like mkdir -p, ln -sf, create-or-update API calls, kubectl apply instead of create, and declarative tools like Terraform and Ansible modules, which do this checking for you; avoid appending blindly, like echoing a line into a config file on every run, and instead check whether it's already there or manage the whole file from a template; and use unique identifiers or idempotency keys for operations that create things, so a retry doesn't create duplicates.

Safety: default to dry-run mode and require an explicit flag for destructive actions; validate inputs and the target environment, like refusing to run against production without confirmation; handle partial failure, writing scripts so a re-run continues from where it stopped; use locks to prevent concurrent runs; and log what was changed. And test scripts in a non-production environment, just like application code."

### [1] What grep, sed and awk one-liners do you use most?
@tags bash, grep, sed, awk
@hook grep finds lines, sed edits streams, awk processes fields. Know a handful of patterns by heart.
@say
"grep searches for lines matching a pattern. I use -i for case-insensitive, -r to search recursively, -n for line numbers, -v to invert the match, -c to count, -E for extended regex, -o to print only the match, and -A or -B to show lines after or before, which is great for stack traces in logs.

sed is a stream editor, mostly for substitution: sed 's/old/new/g' replaces text, -i edits files in place, which I use carefully, ideally with a backup suffix, and it can delete lines matching a pattern or print a range of lines.

awk processes text as fields, split on whitespace by default or with -F for another delimiter, like a comma or colon. It's ideal for extracting columns, filtering on field values, summing and counting, with associative arrays for grouping.

Combined with sort, uniq, cut, wc, head, tail and xargs, they cover most ad-hoc log analysis and text processing on a server. For structured data, I use jq for JSON and yq for YAML rather than regex."
@deep
```bash
grep -rn "ERROR" /var/log/app/ --include='*.log'      # recursive with line numbers
grep -A 20 "Exception" app.log                         # stack trace after the match
grep -c " 500 " access.log                             # count lines
sed -i.bak 's/^LOG_LEVEL=.*/LOG_LEVEL=info/' app.env   # in-place edit with backup
sed -n '100,150p' big.log                              # print a line range
awk -F: '{print $1}' /etc/passwd                       # first field, ':' separated
awk '$9 >= 500 {n++} END {print n}' access.log         # count 5xx responses
df -h | awk 'NR>1 && int($5) > 80 {print $6, $5}'      # filesystems over 80% full
```

### [1] How do you use jq to work with JSON on the command line?
@tags jq, json, kubectl
@hook jq filters and reshapes JSON: .field, .[], select(), map(), -r for raw output. Pair it with kubectl, cloud CLIs and curl.
@say
"jq is a command-line JSON processor, and it's essential because cloud CLIs, kubectl and APIs all output JSON.

The basics: dot-field navigates into objects; square brackets iterate over arrays; pipes chain filters; select keeps elements matching a condition; map transforms arrays; and the -r flag outputs raw strings without quotes, which is what you want when feeding values into other commands. You can also build new objects and arrays to reshape data, and use functions like length, keys, sort_by, group_by and to_entries.

Typical uses: listing pods that aren't running with their restart counts from kubectl get pods -o json; extracting a field from an API response in a script, like a token or an ID; summarising cloud resources, like all instances with their types and owner tags; and validating or pretty-printing JSON files. kubectl also has built-in jsonpath output, but jq is more powerful and readable for anything non-trivial. And yq does the same for YAML, which helps with Kubernetes manifests and pipeline files."
@deep
```bash
# Pods not in Running phase, with restart counts
kubectl get pods -A -o json | jq -r '
  .items[]
  | select(.status.phase != "Running")
  | "\(.metadata.namespace)/\(.metadata.name) \(.status.phase) restarts=\([.status.containerStatuses[]?.restartCount] | add // 0)"'

# Container images in use, de-duplicated
kubectl get pods -A -o json | jq -r '.items[].spec.containers[].image' | sort -u

# Extract a field from an API response
TOKEN=$(curl -s -X POST "$AUTH_URL" -d @creds.json | jq -r '.access_token')

# Azure: VMs with size and owner tag
az vm list -o json | jq -r '.[] | [.name, .hardwareProfile.vmSize, (.tags.owner // "none")] | @tsv'
```

### [2] How do you find what's filling up a disk?
@tags disk, troubleshooting, bash
@hook df to find the full filesystem, du sorted by size to drill down, find for big files, and lsof for deleted-but-open files.
@say
"First, df -h shows which filesystem is full, and df -i whether it's inodes rather than space.

Then I drill down on that filesystem with du: du -xh --max-depth=1 on the mount point, sorted by size, shows which top-level directories are biggest; the -x flag keeps it on one filesystem, so it doesn't wander into other mounts. I repeat in the biggest directory until I find the culprit. ncdu is a nicer interactive version if it's installed.

To find big individual files directly, find with -size +500M and -xdev lists large files on that filesystem.

Usual suspects: application or system logs that aren't rotated, especially in /var/log; Docker images, stopped containers, build cache and container logs in /var/lib/docker, which docker system df shows and docker system prune cleans; old kernels and package caches; core dumps; and temporary files.

If du's total is much smaller than df's used space, the space is held by deleted files that a process still has open, which lsof +L1 shows, and the fix is restarting or reloading that process.

After freeing space, I fix the cause, like log rotation or image cleanup policies, and add a disk usage alert, ideally predictive, like 'will be full in 4 hours', rather than only a static threshold."
@deep
```bash
df -h; df -i
sudo du -xh --max-depth=1 / 2>/dev/null | sort -rh | head -15
sudo find / -xdev -type f -size +500M -exec ls -lh {} + 2>/dev/null | sort -k5 -rh | head
sudo lsof +L1                                  # deleted but still-open files
docker system df && docker system prune -f     # Docker hosts: reclaim space
sudo journalctl --vacuum-size=500M             # cap the systemd journal
```

### [1] What are common YAML pitfalls in DevOps files?
@tags yaml, configuration
@hook Indentation is structure, tabs are illegal, some unquoted values change type (no, on, 08), and multi-line strings have subtle rules. Lint everything.
@say
"YAML is everywhere in DevOps, Kubernetes manifests, CI pipelines, Compose files, Ansible, and its convenience hides several traps.

Indentation defines structure, so a misaligned line silently changes the meaning, like a key ending up under the wrong parent, and tabs aren't allowed at all.

Implicit typing: unquoted values are interpreted. In YAML 1.1 parsers, which many tools still use, yes, no, on and off become booleans, the famous 'Norway problem' where the country code NO becomes false. Version numbers like 1.10 become the float 1.1, and leading zeros or values like 08 can be read as octal or fail. Times like 22:30 may be parsed as sexagesimal numbers. So I quote strings that could be ambiguous, especially versions, codes and anything with special characters.

Special characters: a colon followed by a space, a hash, which starts a comment, and values starting with an asterisk, ampersand or exclamation mark need quoting.

Multi-line strings: the pipe keeps newlines and the greater-than sign folds them, and the trailing modifiers control the final newline.

Duplicate keys may silently override each other.

So I use yamllint, schema validation for the specific tool, like kubeconform for Kubernetes manifests or the CI platform's validator, and an editor with schema support, and I run them in CI."
