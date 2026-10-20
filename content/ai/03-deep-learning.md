@section dl | Deep Learning Essentials
@blurb How neural networks learn, why training goes wrong, and the tricks that make large models trainable at all.

### [1] What is a neural network, and how does it learn?
@tags neural networks, training loop
@hook Layers of weighted sums and non-linearities. Predict, measure the error, push the error backwards, nudge the weights. Repeat millions of times.
@say
"A neural network is a stack of layers. Each layer computes weighted sums of its inputs plus a bias, and passes the result through a non-linear activation function. Stacking layers lets the network learn increasingly abstract features, from edges to shapes to objects in images, or from tokens to syntax to meaning in text.

Learning is a loop. In the forward pass, an input goes through the network to produce a prediction. A loss function measures how wrong it is, like cross-entropy for classification. In the backward pass, backpropagation computes the gradient of the loss with respect to every weight, meaning how much each weight contributed to the error. Then an optimiser, like Adam, updates each weight a small step in the direction that reduces the loss.

Repeating that over many mini-batches and epochs gradually shapes the weights so the network generalises to data it hasn't seen. Everything from image classifiers to LLMs follows this same loop; what changes is the architecture, the data and the scale."
@deep
```python
import torch, torch.nn as nn

model = nn.Sequential(nn.Linear(20, 64), nn.ReLU(), nn.Linear(64, 2))
opt = torch.optim.AdamW(model.parameters(), lr=1e-3, weight_decay=0.01)
loss_fn = nn.CrossEntropyLoss()

for x, y in loader:
    logits = model(x)            # forward pass
    loss = loss_fn(logits, y)    # how wrong
    opt.zero_grad()
    loss.backward()              # backpropagation: compute gradients
    opt.step()                   # update weights
```

### [2] Explain backpropagation.
@tags backpropagation, gradients
@hook The chain rule applied backwards through the network, reusing intermediate results so all gradients cost about one extra forward pass.
@say
"Backpropagation is an efficient way to compute the gradient of the loss with respect to every parameter in the network.

The network is a composition of functions, layer after layer, so by the chain rule, the gradient for an early layer's weights is the product of local derivatives along the path from the loss back to that layer. Backprop computes this starting at the loss and moving backwards one layer at a time. Each layer receives the gradient of the loss with respect to its output, multiplies by its own local derivatives to get the gradients for its weights, and passes the gradient with respect to its input back to the previous layer.

The efficiency comes from reuse: the intermediate activations saved during the forward pass and the gradients flowing backwards are shared, so computing gradients for millions or billions of parameters costs roughly the same as one or two forward passes, instead of one pass per parameter.

Frameworks like PyTorch implement this as automatic differentiation: they record the operations in a computation graph during the forward pass and walk it backwards on loss.backward(). It's also why training needs much more memory than inference: the activations have to be stored for the backward pass."

### [1] Why do neural networks need activation functions? Compare the common ones.
@tags activation functions
@hook Without non-linearity, any stack of layers collapses into one linear function. ReLU and GELU in hidden layers, softmax or sigmoid at the output.
@say
"Without activation functions, each layer is just a linear transformation, and a composition of linear transformations is still linear. A hundred-layer network would be no more expressive than a single layer. Non-linear activations let networks approximate complex functions.

Sigmoid squashes values to 0 to 1, and tanh to minus 1 to 1. They were common historically but saturate at the extremes, where gradients become tiny, causing vanishing gradients in deep networks. Today sigmoid is mainly used at the output for binary or multi-label probabilities.

ReLU, max of 0 and x, is simple, fast and doesn't saturate for positive inputs, which made deep networks trainable. Its weakness is dying neurons that get stuck outputting zero; Leaky ReLU fixes that with a small negative slope.

GELU and SiLU, also called Swish, are smooth versions that work slightly better in transformers. Modern LLMs commonly use SwiGLU, a gated variant, in their feed-forward layers.

Softmax turns a vector of scores into a probability distribution that sums to 1, used for multi-class outputs and for attention weights."

### [2] What are vanishing and exploding gradients, and how are they fixed?
@tags gradients, training stability
@hook Multiplying many small numbers gives almost zero; many large ones gives infinity. Fixes: residual connections, normalisation, good initialisation, clipping.
@say
"During backpropagation, the gradient for early layers is a product of many terms, one per layer. If those terms are mostly smaller than one, the product shrinks exponentially and early layers barely learn: vanishing gradients. If they're mostly larger than one, it grows exponentially and training blows up into NaNs: exploding gradients. Deep networks and recurrent networks, which unroll over many time steps, are especially affected.

The fixes are now standard. Non-saturating activations like ReLU and GELU. Careful weight initialisation, like He or Xavier, so signals keep a stable scale through layers. Normalisation layers, like batch norm or layer norm, which keep activations well-scaled. Residual or skip connections, which add a layer's input to its output, giving gradients a direct highway backwards; this is what made networks with hundreds of layers, and transformers, trainable. Gradient clipping, which caps the gradient norm and prevents explosions, and is standard in LLM training. And for sequences, LSTMs and GRUs used gating to preserve gradients, before transformers replaced recurrence altogether."

### [2] Batch normalisation vs layer normalisation? Why do transformers use layer norm?
@tags normalisation, transformers
@hook Batch norm normalises each feature across the batch. Layer norm normalises across features within each example, so it doesn't depend on batch size.
@say
"Both normalise activations to stabilise and speed up training, but along different dimensions.

Batch normalisation normalises each feature using the mean and variance computed across the examples in the mini-batch, then applies a learned scale and shift. It works very well in CNNs. But it depends on batch statistics, so it behaves differently in training and inference, struggles with small batches, and is awkward for variable-length sequences.

Layer normalisation normalises across all the features within a single example, so it's independent of the batch and of other sequences, behaves identically in training and inference, and handles variable-length sequences naturally. That's why transformers use it.

Modern LLMs often use RMSNorm, a simplified layer norm that skips mean-centring and only rescales by the root mean square, which is cheaper and works just as well. They also typically use pre-norm, normalising the input to each sub-layer rather than the output, which makes very deep transformers more stable to train."

### [2] Compare SGD with momentum, Adam and AdamW.
@tags optimisers
@hook Momentum smooths the path. Adam also adapts the step size per parameter. AdamW fixes how Adam applies weight decay.
@say
"Plain SGD updates each weight by the learning rate times its gradient. With momentum, it keeps an exponentially decaying average of past gradients and moves in that direction, which speeds up progress along consistent directions and dampens zig-zagging. Well-tuned SGD with momentum can generalise very well and is still common in computer vision.

Adam combines momentum with adaptive learning rates: it tracks both the average gradient and the average squared gradient for each parameter, and divides the step by the square root of the latter. Parameters with consistently large gradients take smaller steps; rare or small-gradient parameters take larger ones. It's robust, converges fast and needs less tuning.

AdamW fixes a subtle problem: in original Adam, L2 regularisation added to the loss interacts badly with the adaptive scaling. AdamW decouples weight decay, applying it directly to the weights separately from the gradient update. It's the default for training and fine-tuning transformers.

The cost of Adam-style optimisers is memory: they store two extra values per parameter, which is significant for billion-parameter models, and part of why techniques like optimiser state sharding and 8-bit optimisers exist."

### [2] Why use learning rate warmup and schedules?
@tags training, learning rate
@hook Start gently while the model and optimiser stats are unstable, then decay so you settle into a good minimum.
@say
"At the very start of training, weights are random and Adam's running statistics haven't stabilised, so a large learning rate can cause huge, destructive updates or divergence, especially in transformers. Warmup linearly increases the learning rate from near zero to its peak over the first few hundred or thousand steps, which stabilises early training.

After the peak, a decay schedule gradually lowers the learning rate. Large steps early let the model make fast progress; small steps later let it settle into a good region of the loss landscape instead of bouncing around. Cosine decay is the most common for LLMs, and some recent training runs use warmup-stable-decay schedules that hold the rate constant for most of training and decay at the end, which makes it easy to continue training from checkpoints.

When fine-tuning, learning rates are much smaller than in pretraining, often around 1e-5 for full fine-tuning and around 1e-4 for LoRA, with short warmups, because large updates can destroy what the model already knows."

### [1] Cross-entropy vs mean squared error as a loss function?
@tags loss functions
@hook Cross-entropy for classification and next-token prediction; MSE for predicting numbers.
@say
"Mean squared error averages the squared differences between predicted and actual values. It's the natural loss for regression, predicting continuous numbers, and corresponds to assuming Gaussian noise.

Cross-entropy measures the difference between the predicted probability distribution and the true one. For classification, it's the negative log of the probability the model assigned to the correct class, so confident wrong predictions are punished very heavily, and gradients stay strong even when the model is badly wrong. Paired with softmax, the gradient is simply predicted minus true probabilities, which is clean and stable.

Using MSE for classification works poorly: combined with sigmoid or softmax, gradients become tiny when the model is confidently wrong, so it learns slowly. LLMs are trained with cross-entropy on next-token prediction: at each position, the loss is minus log of the probability assigned to the actual next token. Perplexity, a common language-model metric, is just the exponential of the average cross-entropy."

### [1] What is dropout, and why does it work?
@tags regularisation, dropout
@hook Randomly switch off neurons during training so the network can't rely on any single one. Turned off at inference.
@say
"Dropout is a regularisation technique where, during training, each neuron's output is set to zero with some probability, like 10 to 50 percent, on each forward pass. The remaining activations are scaled up to keep the expected value the same.

It works because the network can't rely on any single neuron or fragile co-adaptations between neurons, so it learns more redundant, robust features. You can also view it as training a huge ensemble of thinned sub-networks that share weights, and averaging them at test time.

At inference, dropout is turned off, which is why you must switch the model to evaluation mode, model.eval() in PyTorch, or predictions will be noisy. A neat trick is Monte Carlo dropout: keeping dropout on at inference and running several passes gives a rough estimate of uncertainty.

In large LLM pretraining, dropout is often set to zero, because with enormous datasets and few passes over the data, overfitting isn't the main problem; it's more common in fine-tuning and smaller models."

### [1] How does a convolutional neural network work?
@tags cnn, computer vision
@hook Small filters slide across the image, detecting local patterns with shared weights. Stack layers to go from edges to objects.
@say
"A CNN is designed for grid-like data such as images. Instead of connecting every pixel to every neuron, a convolutional layer slides small learnable filters, like 3 by 3, across the image. Each filter detects a local pattern, such as an edge or a texture, wherever it appears, and produces a feature map.

Two properties make CNNs efficient. Local connectivity: each output depends only on a small neighbourhood. And weight sharing: the same filter is used at every position, so the number of parameters is tiny compared with a fully connected layer, and a pattern learned in one place is recognised anywhere, which is called translation equivariance.

Stacking layers, often with pooling or strided convolutions to downsample, builds a hierarchy: early layers detect edges, middle layers shapes and parts, and deep layers whole objects. Architectures like ResNet added residual connections to go very deep.

Today vision transformers, which split images into patches treated like tokens, rival or beat CNNs at scale, and multimodal LLMs use them as their image encoders, but CNNs remain efficient and common, especially on edge devices."

### [2] How do RNNs and LSTMs work, and why did transformers replace them?
@tags rnn, lstm, transformers
@hook RNNs read one token at a time and squeeze history into a hidden state. Transformers look at every token at once with attention, and train in parallel.
@say
"A recurrent neural network processes a sequence one step at a time, keeping a hidden state that summarises everything seen so far and is updated at each step. In principle it can model sequences of any length.

In practice, plain RNNs struggle with long-range dependencies because of vanishing gradients through many time steps. LSTMs and GRUs added gates, learned switches that control what to remember, forget and output, which preserved information much longer and powered machine translation and speech recognition for years.

Transformers replaced them for two main reasons. First, parallelism: an RNN must process tokens sequentially, so training can't be parallelised across the sequence, while a transformer processes all positions at once with matrix operations, which suits GPUs and made training on massive datasets feasible. Second, long-range modelling: self-attention connects any two tokens directly in one step, instead of passing information through a long chain of hidden states.

Interestingly, the RNN idea is having a comeback in state space models like Mamba and hybrid architectures, which offer linear-time processing of very long sequences at inference."

### [1] What are embeddings?
@tags embeddings, representations
@hook Dense vectors where meaning becomes geometry: similar things land close together.
@say
"An embedding is a learned dense vector representation of something discrete, like a word, a token, a sentence, an image or a product. Instead of a sparse one-hot vector with no notion of similarity, each item becomes a point in a space of, say, 384 to 3,072 dimensions, where similar items are close together.

Embeddings are learned as part of training. Inside an LLM, there's an embedding table that maps each token ID to a vector, which the transformer layers then refine into contextual representations, so 'bank' gets a different vector in 'river bank' and 'bank account'.

Separately, embedding models are trained specifically to map whole sentences or documents to a single vector such that semantically similar texts have high cosine similarity, usually with contrastive learning on pairs of related texts. Those power semantic search, RAG retrieval, clustering, recommendations, deduplication and classification. In RAG, the quality of the embedding model is often the single biggest factor in retrieval quality."

### [1] What is transfer learning?
@tags transfer learning, fine-tuning
@hook Start from a model that already learned general knowledge on a huge dataset, then adapt it to your task with far less data.
@say
"Transfer learning means taking a model pretrained on a large, general dataset and adapting it to a specific task, instead of training from scratch. The pretrained model has already learned broadly useful representations, like edges and shapes in vision, or grammar, facts and reasoning patterns in language, so you need far less labelled data and compute to get a strong result.

There's a spectrum of ways to adapt it. Use it as a frozen feature extractor and train only a small head on top. Fine-tune some or all layers with a small learning rate. Use parameter-efficient fine-tuning like LoRA, which trains small adapter matrices. Or, with LLMs, simply prompt it with instructions and examples, which is in-context learning with no weight updates at all.

Foundation models are transfer learning taken to the extreme: one model pretrained at enormous scale, adapted to thousands of tasks. That's essentially the premise of AI engineering as a discipline."

### [2] What is mixed precision training? Compare FP32, FP16, BF16 and FP8.
@tags precision, training efficiency, gpu
@hook Do most of the maths in 16-bit (or 8-bit) for speed and memory, keep a 32-bit master copy for stability. BF16 is the default for LLMs.
@say
"Mixed precision training performs most computation in lower-precision formats, which are faster on modern GPUs' tensor cores and use half the memory for activations, while keeping a full 32-bit master copy of the weights for accurate updates.

FP32 is the classic single precision: accurate, but slow and memory-heavy. FP16 halves the memory and is fast, but its small exponent range means tiny gradients underflow to zero, so it needs loss scaling, multiplying the loss up before backprop and the gradients back down. BF16, brain float, keeps FP32's exponent range with fewer mantissa bits, so it has the same dynamic range as FP32 and rarely needs loss scaling. It's the default for training and serving LLMs on modern hardware. FP8 halves memory and compute again; it's increasingly used for training and inference on recent GPUs, with careful per-tensor scaling.

The benefits are roughly 2x or more speed and big memory savings, enabling larger batches or models. In PyTorch, it's a few lines with autocast. The same idea at inference, going down to 8-bit or 4-bit weights, is quantisation."

### [3] How are very large models trained across many GPUs?
@tags distributed training, parallelism, fsdp
@hook Data parallelism copies the model and splits the batch; tensor and pipeline parallelism split the model itself; FSDP and ZeRO shard everything to save memory.
@say
"A large model doesn't fit on one GPU, and training on one GPU would take forever, so we combine several kinds of parallelism.

Data parallelism gives each GPU a full copy of the model and a different slice of each batch; after the backward pass, gradients are averaged across GPUs with an all-reduce. It's simple, but every GPU must hold the full model plus optimiser state.

Sharded data parallelism, ZeRO in DeepSpeed or FSDP in PyTorch, removes that redundancy by sharding the optimiser states, gradients and even the parameters across GPUs, gathering pieces just in time for each layer's computation. That's the workhorse for training and fine-tuning large models.

Tensor parallelism splits individual weight matrices across GPUs, so each GPU computes part of every layer. It needs very fast interconnects like NVLink, so it's usually within a single server.

Pipeline parallelism assigns different layers to different GPUs and streams micro-batches through them like an assembly line, with scheduling to reduce idle bubbles.

For mixture-of-experts models, expert parallelism places different experts on different GPUs. Frontier training combines all of these, so-called 3D or 4D parallelism, plus activation checkpointing, which recomputes activations during the backward pass instead of storing them, trading compute for memory."
