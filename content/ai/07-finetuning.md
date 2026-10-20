@section ft | Fine-Tuning and Alignment
@blurb When to change the weights, how LoRA works, and what RLHF, DPO and RL with verifiable rewards actually do.

### [1] When should you fine-tune instead of prompting or using RAG?
@tags fine-tuning, decision
@hook Fine-tune for behaviour, format, latency and cost; use RAG for knowledge; exhaust prompting first.
@say
"I treat fine-tuning as a later step, not a first one. Prompting is fast to iterate, RAG handles knowledge, and fine-tuning adds a training pipeline, data curation and model versioning to maintain.

Fine-tuning is the right tool when: I need a consistent behaviour or output format that prompting can't make reliable enough; a narrow task, like classification, extraction or routing, needs higher accuracy than prompting gives; the prompt has grown huge with instructions and examples, and baking them into the weights cuts cost and latency; I want a small, cheap, fast model to match a big model on one task, which is distillation; or the domain has specialised language or style.

It's the wrong tool for teaching facts that change, which RAG handles better and more verifiably, or when there isn't enough quality data.

Before fine-tuning, I need three things: a clear eval set showing where prompting falls short, enough high-quality training examples, often hundreds to a few thousand for a narrow task, and a plan to re-evaluate and retrain as the base model and data evolve."

### [2] Full fine-tuning vs parameter-efficient fine-tuning?
@tags peft, fine-tuning
@hook Full fine-tuning updates every weight: best ceiling, huge memory. PEFT trains a tiny add-on and freezes the rest: cheap, fast, swappable.
@say
"Full fine-tuning updates all of the model's parameters. It has the highest potential quality, but it needs a lot of GPU memory, because you need gradients and optimiser states for every parameter, often several times the model's size. Each fine-tuned version is a full copy of the model, and it's more prone to catastrophic forgetting.

Parameter-efficient fine-tuning freezes the base model and trains a small number of new or selected parameters, often well under 1 percent. The main methods are LoRA, which adds low-rank adapter matrices; adapters, small layers inserted between existing ones; and prefix or prompt tuning, which learns virtual tokens.

PEFT's advantages are big: much less memory, so you can fine-tune large models on a single GPU; faster training; small artefacts, megabytes instead of gigabytes; and the ability to serve many adapters on one base model, swapping per customer or task. And it usually gets close to full fine-tuning quality for most tasks.

So PEFT, usually LoRA, is my default, and I'd consider full fine-tuning only for large domain shifts with lots of data and budget."

### [2] How does LoRA work?
@tags lora, peft
@hook Freeze the weight matrix W and learn the update as a product of two thin matrices, B times A. Millions of parameters instead of billions.
@say
"LoRA, low-rank adaptation, is based on the observation that the change in weights needed to adapt a pretrained model to a task has a low intrinsic rank.

So instead of updating a large weight matrix W of size d by d, LoRA freezes W and learns the update as the product of two small matrices: B, which is d by r, and A, which is r by d, where the rank r is small, like 8 to 64. The layer's output becomes W times x plus B times A times x, scaled by a factor alpha over r. B is initialised to zero, so training starts from exactly the original model.

For a 4,096 by 4,096 matrix with rank 16, that's about 131,000 trainable parameters instead of 16.7 million, more than a hundred times fewer. LoRA is typically applied to the attention projections, and often the MLP layers too, which tends to help quality.

Practical benefits: after training, B times A can be merged into W, so there's zero added inference latency; or adapters can be kept separate and swapped dynamically, and servers like vLLM can serve many LoRA adapters on one base model. The key hyperparameters are rank, alpha, which modules to target, and the learning rate, which is usually higher than for full fine-tuning."
@deep
```python
from peft import LoraConfig, get_peft_model

config = LoraConfig(
    r=16, lora_alpha=32, lora_dropout=0.05,
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
    task_type="CAUSAL_LM",
)
model = get_peft_model(base_model, config)
model.print_trainable_parameters()   # e.g. "trainable params: 40M || all params: 8B || 0.5%"
```

### [2] What is QLoRA?
@tags qlora, quantisation, peft
@hook LoRA on top of a base model quantised to 4 bits. Fine-tune big models on a single GPU with little quality loss.
@say
"QLoRA combines quantisation with LoRA. The frozen base model is loaded in 4-bit precision, using a data type called NormalFloat4 designed for normally distributed weights, which cuts the memory for the weights by about four times compared with 16-bit. LoRA adapters are trained on top in higher precision, with gradients flowing through the quantised frozen weights.

It adds a couple of tricks: double quantisation, which also quantises the quantisation constants to save more memory, and paged optimisers, which move optimiser states to CPU memory during memory spikes to avoid out-of-memory errors.

The result is that you can fine-tune much larger models on a single consumer or workstation GPU, and the original paper showed quality close to 16-bit LoRA fine-tuning. The trade-offs are slower training, because of de-quantising on the fly, and a small potential quality loss. It's ideal for experimentation and limited hardware; with ample GPUs, standard LoRA in BF16 is simpler and faster."

### [2] What does supervised fine-tuning data look like, and how much do you need?
@tags sft, data, fine-tuning
@hook Input and ideal-output pairs in the exact chat format you'll use in production. Quality and diversity beat volume.
@say
"Supervised fine-tuning data is a set of examples, each an input and the ideal output, formatted in the model's chat template with system, user and assistant turns, exactly as the model will see them in production. Usually the loss is computed only on the assistant's response tokens, so the model learns to produce answers, not to predict the prompts.

On quantity: for a narrow task like classification, extraction or a specific format, a few hundred to a few thousand high-quality examples often go a long way. Broader behaviour changes need more. But quality and diversity matter far more than volume: consistent labels, correct outputs, coverage of edge cases and the real distribution of inputs, and examples of what to do when the input is invalid or the answer is unknown. A smaller clean dataset beats a large noisy one.

Sources: real production inputs with outputs written or corrected by experts; outputs from a stronger model, reviewed by humans, which is distillation; and synthetic data for rare cases. I always hold out a test set, deduplicate, check for leakage between train and test, and remove personal data. And I compare against the prompted baseline on the same eval set, so I know the fine-tune is actually worth it."

### [2] How does RLHF work?
@tags rlhf, alignment, reward model
@hook Humans rank responses, a reward model learns their preferences, then reinforcement learning (PPO) pushes the LLM toward high reward without drifting too far.
@say
"Reinforcement learning from human feedback aligns a model with human preferences in three steps.

First, supervised fine-tuning on demonstrations gives a model that roughly follows instructions.

Second, preference data collection and reward modelling: for many prompts, the model generates several responses and human labellers rank or compare them, choosing which is more helpful, honest and harmless. A reward model, usually initialised from the LLM itself, is trained to predict which response humans prefer, giving a scalar score for any response.

Third, reinforcement learning, classically with PPO: the model generates responses, the reward model scores them, and the model's weights are updated to increase the expected reward. A KL-divergence penalty against the original SFT model keeps it from drifting too far, which prevents it from exploiting quirks of the reward model, called reward hacking, and from degrading its language ability.

RLHF is what made chat models feel genuinely helpful. Its challenges are cost, since it needs lots of human labels and an unstable multi-model training loop, labeller disagreement and bias, and reward hacking, like models learning that longer or more flattering answers score higher, which shows up as verbosity or sycophancy. Using AI feedback guided by a written set of principles is one way labs scale it."

### [2] DPO vs RLHF? And what are GRPO and RL with verifiable rewards?
@tags dpo, grpo, rlvr, alignment
@hook DPO learns directly from preference pairs, no reward model or RL loop. GRPO and RLVR reward answers that can be checked, which is how reasoning models are trained.
@say
"Direct Preference Optimisation reaches a similar goal to RLHF without a separate reward model or reinforcement learning loop. It uses the same preference data, pairs of a chosen and a rejected response, and a simple classification-style loss that increases the likelihood of the chosen response relative to the rejected one, compared with a frozen reference model. Mathematically, it optimises the same objective as KL-regularised RLHF. It's simpler, more stable and cheaper, so it's widely used, especially for open models and fine-tuning teams without RL infrastructure. Its limitation is that it learns from fixed, offline data, while online RL can explore and learn from the model's own new outputs.

Reinforcement learning with verifiable rewards uses rewards computed by checking the answer, not by a learned preference model: is the maths answer correct, do the unit tests pass, is the output in the right format. That's much harder to game, and it's the key ingredient in training reasoning models to think longer and self-correct.

GRPO, Group Relative Policy Optimisation, popularised by DeepSeek, is an efficient RL algorithm for this: for each prompt, it samples a group of answers, scores them, and uses each answer's reward relative to the group's average as its advantage, which removes the need for a separate value or critic model and saves a lot of memory.

For an AI engineer, DPO is the practical tool for preference tuning a model, and RLVR is worth understanding because it explains how today's reasoning models were made."

### [2] What is catastrophic forgetting, and how do you prevent it?
@tags fine-tuning, forgetting
@hook Fine-tuning on a narrow task can erase general skills. Use small learning rates, LoRA, mixed-in general data, and evaluate broad skills too.
@say
"Catastrophic forgetting is when fine-tuning a model on new data degrades abilities it had before. For example, after fine-tuning heavily on legal document classification, the model might get worse at general instruction following, reasoning or safety behaviours.

Prevention techniques: use parameter-efficient methods like LoRA, which change far fewer weights and keep the base intact; use small learning rates and few epochs, since aggressive training overwrites more; mix in some general instruction data or replay data alongside the task data; use regularisation that keeps the weights or outputs close to the original model; and use early stopping based on validation.

Detection matters as much as prevention: besides the task-specific eval, I run a set of general capability and safety checks before and after fine-tuning, like instruction following, refusals on harmful requests and a few broad benchmarks, to make sure nothing important regressed. And if the model needs to stay general-purpose, it's often better to keep the general model and only route the specific task to the fine-tuned adapter."

### [2] What is knowledge distillation?
@tags distillation, efficiency
@hook Train a small student model to imitate a large teacher. Most of the quality, a fraction of the cost and latency.
@say
"Knowledge distillation trains a smaller student model to reproduce the behaviour of a larger, stronger teacher model.

Classically, the student is trained on the teacher's full output probability distributions, its soft labels, rather than just the correct answers. Those soft probabilities carry richer information, like which wrong answers are 'almost right', so the student learns more per example. For LLMs, the common practical form is sequence-level distillation: generate high-quality outputs from the teacher for a large set of task inputs, filter or verify them, and fine-tune the student on those outputs.

The payoff is a model that's much cheaper and faster to run while keeping most of the teacher's quality on the target task. It's how many small open models are improved, and it's a common production pattern: prototype with a frontier model, collect its outputs on real traffic, then distil into a small model for high-volume serving.

Two cautions: check the teacher provider's terms of service, since some prohibit using outputs to train competing models, and verify the teacher's outputs, because the student will faithfully learn the teacher's mistakes too."

### [2] What are the risks of training on synthetic data?
@tags synthetic data, data quality
@hook Synthetic data scales coverage cheaply, but it can be repetitive, wrong, biased, and leak eval data. Filter, verify and mix with real data.
@say
"Synthetic data, generated by LLMs, is very useful: it can cover rare edge cases, create examples for new tasks with no data, generate questions for RAG evaluation, and scale instruction tuning cheaply.

But it has real risks. Errors: the generator's mistakes become training targets, so the model learns them confidently. Low diversity: LLM-generated data tends to be repetitive in phrasing and structure, so the model overfits to that style and fails on messy real inputs. Bias amplification: the generator's biases are reproduced and can be magnified. Contamination: synthetic examples may overlap with evaluation data, inflating scores. And model collapse: research shows that repeatedly training models on their own generated outputs over generations degrades quality and loses the tails of the distribution.

So I use it carefully: verify or filter outputs with checks, like executing code, validating answers, or an LLM judge plus human spot checks; deliberately vary prompts, personas and seeds for diversity; mix it with real data and weight real data appropriately; deduplicate against the eval sets; and always evaluate on real-world data, never only on synthetic test sets."

### [2] How do you evaluate a fine-tuned model?
@tags evaluation, fine-tuning
@hook Same held-out eval set as the baseline, task metrics per slice, plus general-capability and safety checks, plus cost and latency.
@say
"I compare against a baseline on exactly the same held-out test set, which was never used for training or hyperparameter tuning. The baseline is usually the best prompted version of a strong model, because the fine-tune has to beat what I'd otherwise ship.

Then: task-specific metrics, like accuracy or F1 for classification, exact match and field-level accuracy for extraction, or a calibrated LLM judge for open-ended outputs, broken down by slice, such as category, input length or language, so I see where it helps or hurts. Regression checks on general capabilities and safety, to catch catastrophic forgetting. Format and validity checks, like the share of outputs passing schema validation. Robustness on messy, real inputs and edge cases, not just clean ones. And practical metrics: latency, throughput and cost per request, which are often the reason for fine-tuning in the first place.

During training I watch training and validation loss to catch overfitting, but loss isn't the goal; downstream task metrics are. Finally, a shadow or canary rollout with online metrics before full replacement."

### [2] How do you fine-tune an embedding model for better retrieval?
@tags embeddings, fine-tuning, retrieval
@hook Build query and passage pairs from your domain, mine hard negatives, train with a contrastive loss, and measure recall@k before and after.
@say
"If the general embedding model doesn't understand my domain's vocabulary, like internal product names, legal terms or medical jargon, fine-tuning it can improve retrieval significantly.

The data is pairs of a query and its relevant passage. I get them from real search logs and click data, from questions linked to the documents that answered them, like support tickets and the knowledge-base article that resolved them, or by generating synthetic questions for each chunk with an LLM and filtering them for quality.

Hard negatives are the most valuable ingredient: passages that look similar to the query but don't answer it, often mined by taking top results from the current model that aren't the correct passage. They teach fine distinctions.

Training uses a contrastive loss, such as multiple negatives ranking loss, where other passages in the batch also act as negatives, with libraries like Sentence Transformers. Then I evaluate recall at k and nDCG on a held-out set of real queries, compared with the original model. Two operational notes: a new embedding model means re-embedding the whole corpus, and a reranker fine-tuned on the same data is sometimes an easier, bigger win."
