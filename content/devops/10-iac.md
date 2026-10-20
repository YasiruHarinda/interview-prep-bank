@section iac | Infrastructure as Code: Terraform and Ansible
@blurb State, drift, modules, environments, failed applies, secrets, testing and choosing the right tool.

### [1] What is infrastructure as code? Declarative vs imperative?
@tags iac, basics
@hook Define infrastructure in versioned code instead of clicking in consoles. Declarative says what the end state is; imperative says which steps to run.
@say
"Infrastructure as code means defining servers, networks, databases, permissions and other infrastructure in code files that are versioned in Git, reviewed through pull requests, and applied by automation, rather than created by hand in a console.

The benefits: reproducibility, so environments can be recreated identically, which also makes disaster recovery realistic; consistency between dev, staging and production; history and auditability through Git; review and testing before changes go live; and speed, since a whole environment can be created in minutes.

Declarative tools, like Terraform, CloudFormation, Bicep and Kubernetes manifests, describe the desired end state: 'there should be a VNet with these three subnets'. The tool works out what to create, change or delete to reach that state, and running it again is idempotent. Imperative approaches, like scripts with cloud CLI commands, describe the steps: 'create a VNet, then add a subnet'. They're flexible but you must handle existing resources, ordering and partial failures yourself.

Most infrastructure provisioning today is declarative. Configuration management tools like Ansible are declarative per task but procedural in ordering, and general-purpose language tools like Pulumi or CDK write imperative code that produces a declarative model."

### [1] Explain the core Terraform workflow.
@tags terraform, workflow
@hook init downloads providers and sets up the backend, plan shows the diff between code and reality, apply makes it so, destroy removes it.
@say
"terraform init initialises the working directory: it downloads the providers declared in the configuration, like azurerm or aws, at versions allowed by the constraints and recorded in the lock file, downloads modules, and configures the backend where state is stored.

terraform plan compares the desired state in the code with the current state, refreshing it from the real infrastructure, and produces an execution plan: which resources will be created, updated in place, replaced or destroyed. Reading the plan carefully, especially anything marked 'forces replacement' or destroy, is the most important safety step.

terraform apply executes the plan. In automation, I save the plan to a file with -out, review it, and apply exactly that saved plan, so what gets applied is what was approved.

terraform destroy removes everything managed by the configuration.

Supporting commands: fmt for formatting, validate for syntax and internal consistency, and state subcommands and import for managing state. In a team, these run in a pipeline: fmt, validate and plan on pull requests, with the plan posted for review, and apply on merge, with approval for production."

### [1] What is Terraform state, and how should you manage it?
@tags terraform, state, backend
@hook State maps your code to real resource IDs. Store it remotely, lock it, encrypt it, restrict access, and never edit it by hand.
@say
"Terraform state is a file that records the mapping between resources in the configuration and the real objects in the cloud, with their IDs and attributes, plus dependency metadata. Terraform needs it to know what it manages, to compute diffs efficiently, and to know what to delete when a resource is removed from the code.

In a team, state must never live on a laptop or in Git. I use a remote backend, like an Azure Storage account, an S3 bucket, Terraform Cloud or another managed backend, with: locking, so two applies can't run at the same time and corrupt state; Azure blob leases and S3's native lock file support handle that; encryption at rest, because state can contain sensitive values in plain text, like database passwords and keys; strict access control, since read access to state can mean access to secrets; and versioning on the storage, so a corrupted state can be restored.

I also split state into multiple smaller states, by environment and by component, like networking, data and applications, which reduces the blast radius of mistakes, speeds up plans and limits who needs access to what. State is modified only through Terraform commands, like state mv or import blocks, never edited by hand."

### [2] How do you detect and handle configuration drift?
@tags terraform, drift, governance
@hook Drift is reality diverging from code, usually from manual changes. Detect it with scheduled plans, then decide: revert it, or codify it. Prevent it with permissions.
@say
"Drift happens when the real infrastructure no longer matches the code, usually because someone changed something manually in the console during an incident, or another tool or process modified the resource.

Detection: run terraform plan on a schedule, for example nightly, in CI, using -detailed-exitcode, which returns a distinct code when changes are detected, and alert or open an issue when drift is found. Platforms like Terraform Cloud, Spacelift and env0 have built-in drift detection, and cloud policy tools can flag non-compliant changes.

Handling it: for each drift, decide whether the manual change was wrong, in which case applying Terraform reverts it, or whether it was a legitimate change, like an emergency scale-up during an incident, in which case update the code to match and apply, so the code is the truth again. Terraform's plan with refresh-only mode helps update state for changes that should be accepted.

Prevention matters most: restrict write permissions in production so changes go through the pipeline, with break-glass access that's logged and time-limited; make the pipeline fast enough that people don't feel the need to bypass it; and use lifecycle ignore_changes only for attributes that are legitimately managed outside Terraform, like an autoscaler adjusting a node count."

### [2] How do you structure Terraform for multiple environments?
@tags terraform, modules, environments
@hook Reusable modules for components; a thin root configuration per environment with its own state and variables. Promote module versions through environments.
@say
"I separate reusable modules from environment configurations.

Modules package a component with a clean interface: inputs as variables, outputs, and sensible defaults, for example a network module, an AKS cluster module or a database module. They're versioned, in a separate repository or a registry with tags, so environments can pin specific versions.

Each environment, dev, staging and production, has its own small root configuration that calls those modules with environment-specific values, and its own backend and state. Often it's further split by layer, like networking, shared services and applications, each with separate state, wired together through outputs or data sources.

Changes are promoted like code: bump the module version in dev, apply, verify, then staging, then production, so production only receives tested versions.

On workspaces: Terraform CLI workspaces give separate state from one configuration, which is convenient for short-lived or very similar copies, but for long-lived environments that differ in size, access and approvals, separate directories are clearer and safer, because it's obvious which environment you're changing and they can have different permissions. Tools like Terragrunt help reduce duplication in directory-per-environment layouts."
@deep
```text
infra/
  modules/                      (or a separate repo, versioned with tags)
    network/  main.tf variables.tf outputs.tf
    aks/
    postgres/
  envs/
    dev/
      network/   main.tf  backend.tf  terraform.tfvars
      platform/  main.tf  backend.tf  terraform.tfvars
    staging/ ...
    prod/    ...
```
```hcl
module "aks" {
  source  = "git::https://github.com/acme/tf-modules.git//aks?ref=v1.6.0"
  name    = "orders-prod"
  node_count = 5
  vnet_subnet_id = data.terraform_remote_state.network.outputs.aks_subnet_id
}
```

### [2] count vs for_each in Terraform?
@tags terraform, loops
@hook count indexes by number, so removing one item shifts and recreates the rest. for_each keys by name, so changes stay targeted.
@say
"Both create multiple instances of a resource or module.

count takes a number, and instances are addressed by index, like subnet[0], subnet[1], subnet[2]. It's fine for identical copies, or as a simple on-off switch with count equals condition ? 1 : 0. The problem is that if you build it from a list and remove an item from the middle, every later index shifts, so Terraform wants to destroy and recreate those resources, which can be disastrous for things like databases or subnets in use.

for_each takes a map or a set of strings, and instances are addressed by key, like subnet["app"] and subnet["data"]. Adding or removing one key only affects that instance. Each instance also gets each.key and each.value, which makes per-instance configuration clearer.

So I use for_each by default for collections of distinct things, and count only for identical copies or conditional creation. If you need to migrate from count to for_each, moved blocks let you map the old indexes to the new keys without recreating resources."
@deep
```hcl
variable "subnets" {
  type = map(string)
  default = {
    app  = "10.0.1.0/24"
    data = "10.0.2.0/24"
  }
}

resource "azurerm_subnet" "this" {
  for_each             = var.subnets
  name                 = each.key
  address_prefixes     = [each.value]
  resource_group_name  = azurerm_resource_group.rg.name
  virtual_network_name = azurerm_virtual_network.vnet.name
}
```

### [2] How do you bring existing resources under Terraform, or refactor without destroying anything?
@tags terraform, import, refactoring
@hook import blocks adopt existing resources; moved blocks rename addresses; removed blocks stop managing without destroying. Always check the plan says no destroys.
@say
"To adopt resources that were created manually, I use import blocks in the configuration, specifying the resource address and the real resource ID. Terraform can even generate the matching configuration with plan and the generate-config-out option, which I then clean up. Running plan should then show the resource as imported with no changes, or only the differences I intend. The older terraform import command does the same imperatively, but blocks are reviewable in a pull request.

For refactoring, like renaming a resource, moving it into a module, or switching from count to for_each, the resource's address changes, and Terraform would otherwise destroy the old one and create a new one. A moved block tells Terraform that the old address is now the new address, so it just updates state. terraform state mv does the same imperatively.

To stop managing a resource without deleting it, for example handing it to another team's configuration, a removed block, with a lifecycle setting of destroy equals false, removes it from state but leaves the real resource alone. The older equivalent is terraform state rm.

In every case, the plan must show zero unintended destroys before applying, and I'd back up the state first."

### [2] A terraform apply failed halfway through. How do you recover? What about a stuck state lock?
@tags terraform, failure recovery, incidents
@hook Don't panic and don't hand-edit state. Read the error, re-run plan to see the true state, fix the cause, apply again. Force-unlock only when you're sure nobody is running.
@say
"Terraform doesn't roll back a failed apply: resources that were created or changed before the error stay that way, and Terraform records them in state, so the state reflects partial progress. That's usually fine, because the next run continues from there.

My steps: first, read the error carefully. Common causes are permissions, quotas, name conflicts, API rate limits, timeouts, or a dependency not being ready yet. If it's production, I tell the people involved what's in a partial state and what impact that has, because communicating status during an incident matters as much as the fix.

Then I fix the cause, like adding the permission, raising the quota or correcting the configuration, and run plan again. The new plan shows what still needs to happen given the partially applied state. Then apply. If a resource was created in the cloud but the apply failed before Terraform saved it to state, it might show up as 'already exists'; then I import it rather than delete it.

For a stuck lock, which happens when a run crashed or a pipeline was cancelled: I first confirm nobody is actually running an apply, by checking the lock's metadata, who and when, and the pipeline history. Only then do I run terraform force-unlock with the lock ID. Force-unlocking while another apply is running can corrupt state. And I'd keep the state backend versioned, so a corrupted state can be restored from a previous version."

### [1] What do the lifecycle meta-arguments do? What replaced terraform taint?
@tags terraform, lifecycle
@hook create_before_destroy avoids downtime on replacement, prevent_destroy guards critical resources, ignore_changes tolerates external edits, replace_triggered_by forces linked replacements. taint became plan -replace.
@say
"The lifecycle block customises how Terraform handles changes to a resource.

create_before_destroy: when a change forces replacement, create the new resource first and destroy the old one afterwards, instead of the default destroy-then-create. That avoids downtime for things like certificates, launch templates or instance groups, though names must not collide.

prevent_destroy: Terraform refuses any plan that would destroy the resource. It's a safety net for critical stateful resources like production databases and storage accounts, though it doesn't stop someone deleting the code block entirely.

ignore_changes: ignore differences in specific attributes, for values legitimately managed outside Terraform, like tags added by a policy or a node count changed by an autoscaler. It should be used narrowly, or it hides drift.

replace_triggered_by: replace this resource when another resource or attribute changes.

Plus precondition and postcondition blocks to validate assumptions.

The old terraform taint command, which marked a resource to be recreated on the next apply, is deprecated in favour of terraform plan or apply with -replace and the resource address, which shows the replacement in the plan before it happens, which is safer."

### [1] Explain variables, outputs, locals and data sources.
@tags terraform, basics
@hook Variables are inputs, outputs are return values, locals are named expressions, data sources read existing things without managing them.
@say
"Input variables parameterise a configuration or module: declared with a type, description, optional default and validation rules, and set through tfvars files, environment variables like TF_VAR_name, or the command line. Marking a variable sensitive hides it from plan output, though it's still stored in state.

Outputs expose values from a module or root configuration, like a subnet ID or a cluster endpoint, so other modules or configurations can use them, or so they're displayed after apply.

Locals are named expressions computed inside a module, used to avoid repetition and give meaningful names to derived values, like a standard name prefix or a merged map of tags.

Data sources read information about existing infrastructure that this configuration doesn't manage, like looking up the latest approved machine image, an existing resource group, the current account or subscription, or outputs of another state through terraform_remote_state. They're queried during plan.

Good modules have typed, validated, documented variables with minimal required inputs, and only output what consumers actually need."

### [1] Why pin provider and module versions? What is the lock file?
@tags terraform, versioning, reproducibility
@hook Unpinned providers upgrade themselves and change behaviour under you. Version constraints plus the committed lock file make runs reproducible.
@say
"Providers and modules evolve, and a new major version can change resource behaviour, defaults or schemas, or contain bugs. If versions float, the same code can produce different plans on different days or machines, including surprise replacements.

So I declare version constraints in the required_providers block, typically the pessimistic constraint like tilde greater-than 4.10, allowing patch and minor updates within a major version, plus a required Terraform version. For modules from a registry or Git, I pin an exact version or tag.

The dependency lock file, .terraform.lock.hcl, created by terraform init, records the exact provider versions selected and their checksums for each platform. It should be committed to Git, so CI and every engineer use exactly the same provider builds, and checksum verification protects against tampered downloads.

Upgrades then become deliberate: terraform init -upgrade within the constraints, or loosening the constraint, in a pull request, with the plan reviewed and applied to dev first. Tools like Renovate or Dependabot can propose those updates automatically."

### [2] How do you handle secrets in Terraform?
@tags terraform, secrets, security
@hook Keep secrets out of code and tfvars, generate or fetch them at apply time, protect the state (which may still hold them), and prefer identities over passwords.
@say
"First, never hardcode secrets in .tf files or commit them in tfvars files.

For secrets Terraform needs as inputs, I pass them from the pipeline's secret store as environment variables, marked as sensitive variables, or better, read them at apply time from a secrets manager with a data source, like azurerm_key_vault_secret or aws_secretsmanager_secret_version.

For secrets Terraform creates, like a database admin password, I generate them with the random_password resource and write them straight into a secrets manager, so applications read them from there, not from Terraform outputs. Even better, avoid passwords entirely: use managed identities or workload identity with Entra ID or IAM authentication to the database, so there's no secret to manage.

The important caveat is that sensitive values still end up in the state file in plain text, since marking them sensitive only hides them from the console output. So the state backend must be encrypted, access-controlled and audited. Newer Terraform versions add ephemeral values and write-only arguments, which let some secrets be used during apply without ever being stored in state, and I'd use those where providers support them.

In CI, the pipeline authenticates to the cloud with OIDC federation rather than stored credentials."

### [1] Terraform vs Ansible. When do you use each?
@tags terraform, ansible, comparison
@hook Terraform provisions infrastructure declaratively with state. Ansible configures machines and runs procedures, agentless over SSH. Different jobs, often used together.
@say
"Terraform is an infrastructure provisioning tool. It's declarative, keeps state, understands dependencies between resources, and talks to cloud and SaaS APIs to create, update and delete infrastructure: networks, clusters, databases, DNS records and IAM. It's great at managing the lifecycle of resources, including knowing what to destroy.

Ansible is a configuration management and automation tool. It connects to machines agentlessly, over SSH or WinRM, and runs ordered tasks from playbooks using idempotent modules: installing packages, managing files and services, configuring applications, patching, and orchestrating procedures like rolling restarts. It doesn't keep state about infrastructure, so it's weaker at managing the full lifecycle of cloud resources and especially at deleting them.

A common pattern combines them: Terraform provisions the VMs and network, and Ansible configures the operating system and applications on them, or bakes images with Packer and Ansible. In container and Kubernetes-centric environments, much of Ansible's role shrinks, since configuration is in images and manifests, but it remains very useful for VMs, network devices, on-premise servers and operational runbooks."

### [2] Terraform vs Bicep vs CloudFormation vs Pulumi, and what is OpenTofu?
@tags iac tools, comparison, opentofu
@hook Terraform and OpenTofu: multi-cloud with one workflow. Bicep and CloudFormation: native to one cloud, no state file to manage. Pulumi: real programming languages.
@say
"Terraform is the most widely used multi-cloud IaC tool, with a huge provider ecosystem covering clouds, Kubernetes, SaaS like GitHub, Datadog and Cloudflare. One language, HCL, and one workflow for everything. You manage the state yourself.

OpenTofu is an open-source fork of Terraform, created in 2023 after HashiCorp changed Terraform's license from the open-source MPL to the Business Source License, and it's now under the Linux Foundation. It's largely compatible with Terraform configurations, and has added some features of its own, like state encryption. Organisations choose between them based on licensing preferences and features; HashiCorp itself is now owned by IBM.

Bicep is Azure's native IaC language, compiling to ARM templates. CloudFormation is AWS's native equivalent. Their advantages: day-one support for new cloud features, no state file to host, since the cloud tracks deployments, and deep integration with the platform. The downside is single-cloud only.

Pulumi and the AWS CDK let you write infrastructure in general-purpose languages like TypeScript, Python, C# or Go, with loops, functions, classes and normal testing frameworks. That's powerful for complex logic and for developer-heavy teams, but can lead to overly clever infrastructure code.

My choice depends on context: Terraform or OpenTofu for multi-cloud or SaaS-heavy estates; Bicep for an Azure-only shop that wants simplicity; Pulumi when the team strongly prefers a general-purpose language."

### [1] What are the core concepts of Ansible?
@tags ansible, configuration management
@hook Agentless over SSH. Inventory says which hosts, playbooks say what to do, tasks call idempotent modules, roles package reusable logic, handlers run on change.
@say
"Ansible is agentless: it connects to hosts over SSH, or WinRM for Windows, and runs modules there, so nothing needs to be installed on managed hosts beyond Python.

The inventory lists the hosts and groups them, like webservers and databases, statically in a file or dynamically from a cloud provider's API, with variables per host or group.

A playbook is a YAML file of plays; each play targets a group of hosts and runs an ordered list of tasks. Each task calls a module, like apt, copy, template, service or user, with parameters. Modules are idempotent: they check the current state and only make changes when needed, so running a playbook twice yields the same result, and the output reports what changed.

Handlers are tasks triggered only when notified by a change, typically 'restart nginx if its config file changed'.

Roles package tasks, handlers, templates, files and defaults into a reusable structure, shared through Ansible Galaxy or collections. Templates use Jinja2 to render configuration files from variables. Ansible Vault encrypts sensitive variables.

Good practices: use modules instead of raw shell commands, which breaks idempotency; test playbooks with Molecule; and run with --check and --diff to preview changes."
@deep
```yaml
- name: Configure web servers
  hosts: webservers
  become: true
  tasks:
    - name: Install nginx
      ansible.builtin.apt:
        name: nginx
        state: present
        update_cache: true
    - name: Deploy site config
      ansible.builtin.template:
        src: site.conf.j2
        dest: /etc/nginx/conf.d/site.conf
      notify: Reload nginx
  handlers:
    - name: Reload nginx
      ansible.builtin.service:
        name: nginx
        state: reloaded
```

### [2] How do you test infrastructure code and run it safely in CI/CD?
@tags iac testing, ci, policy
@hook Static checks and security scans first, plan on every pull request with the diff posted for review, policy checks on the plan, apply on merge with approvals, and real tests for modules.
@say
"I use layers, from cheapest to most thorough.

Static checks on every pull request: terraform fmt -check, terraform validate, and tflint for provider-specific mistakes like invalid instance types; plus security and misconfiguration scanners, like Checkov, Trivy or tfsec, for things like public storage, missing encryption or open security groups.

Plan: terraform plan runs in the pipeline for every affected environment and component, and the summarised plan is posted as a comment on the pull request, so reviewers see exactly what will change, especially any destroys or replacements.

Policy as code on the plan: Open Policy Agent with Conftest, or Sentinel in Terraform Cloud, checks organisational rules against the planned changes, like allowed regions, required tags, approved VM sizes, or 'no public IPs in production', and blocks violations.

Apply: on merge, the pipeline applies the reviewed plan, with environment approvals for production, OIDC credentials scoped per environment, and a lock so only one apply runs at a time.

For reusable modules, real tests: Terraform's native test framework, or Terratest, deploy the module into a sandbox account, assert on the results, and destroy it. And after deployment, smoke tests confirm the infrastructure actually works."

### [2] What is policy as code? OPA, Sentinel, Kyverno, Azure Policy?
@tags policy as code, governance, opa
@hook Write your rules, like "no public buckets" or "every resource has an owner tag", as code, and enforce them automatically in pipelines and at admission time.
@say
"Policy as code expresses organisational rules for security, compliance and cost as machine-readable code, versioned and tested like any other code, and enforced automatically instead of through manual reviews and checklists.

Where it's enforced: in CI, against infrastructure-as-code plans, using Open Policy Agent with its Rego language and Conftest, Sentinel in Terraform Cloud, or Checkov's custom policies. At deployment time in Kubernetes, through admission controllers: OPA Gatekeeper uses Rego, while Kyverno uses Kubernetes-style YAML policies, which many teams find easier; they can validate, mutate, for example adding default labels, and generate resources, and can verify image signatures. And in the cloud itself: Azure Policy and AWS Config rules or service control policies evaluate and can deny or remediate non-compliant resources regardless of how they were created.

Typical policies: required tags, allowed regions and SKUs, encryption required, no public endpoints in production, containers must not run privileged or as root, images must come from the company registry and be signed, and resource limits must be set.

Good practice is to roll out new policies in audit or warn mode first, give clear error messages explaining how to fix a violation, and allow time-limited, documented exceptions."

### [3] How does Terraform decide the order of operations?
@tags terraform, dependency graph, internals
@hook It builds a dependency graph from references between resources, then walks it in parallel. depends_on is for hidden dependencies only.
@say
"Terraform builds a directed acyclic graph of all resources, data sources and modules. Edges come mainly from implicit dependencies: whenever one resource references another's attribute, like a subnet referencing the VNet's name or a VM referencing a subnet ID, Terraform knows the referenced one must be created first, and destroyed after.

It then walks the graph, creating, updating or deleting independent resources in parallel, ten at a time by default, which you can change with the -parallelism flag. Destruction happens in reverse dependency order. terraform graph can output the graph for visualisation.

depends_on adds explicit dependencies when there's a relationship Terraform can't see from references. For example, an application needs an IAM role's policy attachment to exist before it starts, but doesn't reference the attachment directly. It should be used sparingly, because it makes the dependency coarser, and on modules or data sources it can cause unnecessary 'known after apply' values and extra changes in plans.

Understanding the graph explains several behaviours: cycles cause errors, which usually means a design problem; changing a resource that many others reference can trigger cascading updates; and splitting configurations into separate states breaks the graph, so dependencies between them are expressed through outputs and data sources, applied in the right order by the pipeline."
