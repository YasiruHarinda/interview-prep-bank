@section ml | Machine Learning Fundamentals
@blurb Still about a quarter of the technical questions. Short, classic, and an easy way to lose credibility if you fumble them.

### [1] Supervised vs unsupervised vs self-supervised vs reinforcement learning?
@tags ml basics
@hook Supervised: learn from labels. Unsupervised: find structure without labels. Self-supervised: make labels from the data itself. RL: learn from rewards.
@say
"In supervised learning, the model learns from labelled examples, input and correct output pairs, like emails labelled spam or not spam, or house features with prices. It covers classification and regression.

Unsupervised learning has no labels; the model finds structure on its own, like clustering customers into segments, reducing dimensions with PCA, or detecting anomalies.

Self-supervised learning creates labels automatically from the data itself. It's how large language models are pretrained: the 'label' for each position is simply the next token in the text. Image models do similar things by predicting masked patches. It lets models learn from enormous amounts of unlabelled data.

Reinforcement learning has an agent take actions in an environment and learn from rewards rather than correct answers, like game-playing agents or robotics. It's also central to modern LLM training: RLHF and reinforcement learning with verifiable rewards are how models are tuned to be helpful and to reason better.

Many real systems combine them: self-supervised pretraining, supervised fine-tuning, then reinforcement learning."

### [1] Explain the bias-variance trade-off.
@tags bias variance, generalisation
@hook Bias: too simple, wrong in the same way everywhere. Variance: too sensitive, memorises noise. You want the sweet spot that generalises.
@say
"A model's error on new data comes from three sources: bias, variance and irreducible noise.

Bias is error from wrong or overly simple assumptions, like fitting a straight line to a curved relationship. A high-bias model underfits: it performs poorly on both training and test data.

Variance is error from being too sensitive to the specific training data. A high-variance model, like a very deep decision tree, fits the training data almost perfectly, including its noise, but performs much worse on new data. That's overfitting.

Increasing model complexity typically lowers bias but raises variance, so there's a trade-off, and the goal is the complexity that minimises total error on unseen data. Tools for managing it: more training data reduces variance; regularisation, dropout and simpler models reduce variance; more features or more expressive models reduce bias; and ensembles help too, since bagging reduces variance and boosting reduces bias.

A nuance worth knowing: very large neural networks can show 'double descent', where test error improves again past the point of fitting the training data, which is part of why huge models generalise better than classical theory predicted."

### [1] How do you detect and fix overfitting and underfitting?
@tags overfitting, underfitting
@hook Compare training and validation performance. Big gap means overfitting; both bad means underfitting.
@say
"I compare training and validation metrics, ideally as learning curves over training time or dataset size.

If training performance is great but validation is much worse, the model is overfitting: it memorised the training data. Fixes: get more data or use data augmentation; add regularisation like L1, L2, dropout or weight decay; reduce model complexity; use early stopping when validation loss stops improving; and do feature selection to remove noisy features.

If both training and validation performance are poor, the model is underfitting: it's too simple to capture the pattern. Fixes: a more expressive model, better or more features, less regularisation, or training longer.

I always check the boring causes first, though: data leakage can make a model look great when it isn't, and label noise or a bug in preprocessing can look like underfitting."

### [1] L1 vs L2 regularisation?
@tags regularisation
@hook Both penalise big weights. L1 (absolute) drives some to exactly zero, so it selects features. L2 (squared) shrinks all smoothly.
@say
"Regularisation adds a penalty on the size of the model's weights to the loss function, which discourages overly complex models and reduces overfitting.

L1 regularisation, used in Lasso, adds the sum of the absolute values of the weights. Its geometry tends to push some weights to exactly zero, so it performs automatic feature selection, which is useful when you have many features and suspect only some matter.

L2 regularisation, used in Ridge and called weight decay in neural networks, adds the sum of the squared weights. It shrinks all weights smoothly towards zero without eliminating them, and it handles correlated features more gracefully by spreading weight across them.

Elastic Net combines both. The strength of the penalty, lambda, is a hyperparameter tuned on validation data: too high and the model underfits, too low and it overfits. In deep learning, AdamW applies weight decay correctly decoupled from the gradient update, which is why it's the standard optimiser for training transformers."

### [1] Why split data into training, validation and test sets? What is cross-validation?
@tags evaluation, data splits
@hook Train to learn, validate to tune, test once at the end. Cross-validation rotates the validation fold for a more reliable estimate.
@say
"The training set is used to fit the model's parameters. The validation set is used to make decisions: choosing hyperparameters, features and model types, and early stopping. The test set is held back and used once, at the very end, to estimate performance on truly unseen data. If you tune against the test set, it stops being an honest estimate, because you've indirectly fitted to it.

Cross-validation gives a more reliable estimate when data is limited. In k-fold cross-validation, the data is split into k folds, typically 5 or 10; the model is trained k times, each time validating on a different fold and training on the rest, and the scores are averaged. That uses all the data for both training and validation and shows how much performance varies.

The splits must match reality. For time series, I use time-based splits, always training on the past and validating on the future. For imbalanced classes, stratified splits keep class proportions. And if there are groups, like several records per patient, all of a group's records must be in the same split, otherwise the model sees the same patient in training and test."

### [2] What is data leakage? Give examples.
@tags data leakage, evaluation
@hook Information the model won't have at prediction time sneaks into training. Results look amazing offline and collapse in production.
@say
"Data leakage is when information that wouldn't be available at prediction time ends up in training, so offline metrics look great but the model fails in production.

Common examples: Target leakage, where a feature is derived from the outcome, like using 'account closed date' to predict churn, or a 'treatment received' feature to predict a diagnosis. Train-test contamination, like fitting a scaler or imputer on the full dataset before splitting, so the training process saw test statistics. Temporal leakage, like randomly splitting time-series data, so the model trains on the future to predict the past. And duplicate or grouped leakage, where near-identical records, or several records from the same user, land in both train and test.

To prevent it: split first, then do all preprocessing inside a pipeline fitted on training data only; use time-based splits for anything temporal; group-aware splits; and for every feature ask 'would I know this at the moment I make the prediction?' A suspiciously high accuracy is my first signal to go looking.

For LLMs, the equivalent is benchmark contamination: test questions that leaked into the pretraining data."

### [1] Precision, recall and F1. When do you prioritise each?
@tags metrics, classification
@hook Precision: of what I flagged, how much was right. Recall: of what was really there, how much did I catch. F1 balances them.
@say
"Precision is true positives divided by everything the model predicted as positive: when it says yes, how often is it right. Recall is true positives divided by all actual positives: of all the real cases, how many did it catch. F1 is the harmonic mean of the two, which is only high when both are high.

Which matters more depends on the cost of each mistake. When false positives are expensive, prioritise precision. A spam filter that sends a real job offer to spam is bad, and so is a fraud system that blocks legitimate customers constantly. When false negatives are expensive, prioritise recall. Missing a cancer in screening or missing actual fraud is worse than a false alarm that a human reviews.

There's a trade-off controlled by the decision threshold: lowering the threshold catches more positives, raising recall, but adds false alarms, lowering precision. So I choose the threshold based on business costs, often with a precision-recall curve, rather than defaulting to 0.5. And I never report accuracy alone on imbalanced data: if 1 percent of transactions are fraud, a model that always says 'not fraud' is 99 percent accurate and useless."
@deep
| | Predicted positive | Predicted negative |
|---|---|---|
| Actually positive | True positive (TP) | False negative (FN) |
| Actually negative | False positive (FP) | True negative (TN) |

- Precision = TP / (TP + FP)
- Recall (sensitivity) = TP / (TP + FN)
- Specificity = TN / (TN + FP)
- F1 = 2 x precision x recall / (precision + recall)
- F-beta weights recall beta times as much as precision (F2 favours recall).

### [2] ROC-AUC vs PR-AUC. Which do you use for imbalanced data?
@tags metrics, imbalance
@hook ROC-AUC can look rosy when negatives dominate. PR-AUC focuses on the rare positive class, so it's more honest for imbalance.
@say
"The ROC curve plots the true positive rate against the false positive rate across all thresholds, and ROC-AUC summarises it: the probability that the model ranks a random positive above a random negative. 0.5 is random, 1.0 is perfect. It's threshold-independent and good for comparing models on reasonably balanced problems.

The problem with heavy imbalance is that the false positive rate is divided by the huge number of negatives, so even thousands of false alarms barely move it, and ROC-AUC can look excellent while precision is terrible.

The precision-recall curve plots precision against recall, and PR-AUC, also called average precision, summarises it. Since precision directly reflects false positives relative to predicted positives, it's much more sensitive to performance on the rare class. The baseline for PR-AUC is the positive rate, so for 1 percent fraud, a random model scores about 0.01.

So for fraud, rare disease, defect detection or anything with a rare positive class, I report PR-AUC, plus precision and recall at the operating threshold we'll actually use."

### [2] How do you handle an imbalanced dataset?
@tags imbalance, classification
@hook Pick the right metric first, then rebalance with class weights or resampling, tune the threshold, and get more minority data if you can.
@say
"First I fix the evaluation, because accuracy is misleading: I use precision, recall, F1 and PR-AUC, with stratified splits so every fold has minority examples.

Then several techniques, usually in this order. Class weights in the loss function, so mistakes on the minority class cost more; most libraries support it and it's simple. Threshold tuning, choosing the decision threshold from the precision-recall trade-off instead of 0.5, which is often the biggest win. Resampling: undersampling the majority class, which loses data, or oversampling the minority, either by duplication or synthetic methods like SMOTE, always applied only to the training data after splitting. Choosing algorithms that cope well, like gradient-boosted trees with appropriate weights. And if possible, collecting more minority examples, or reframing the problem as anomaly detection when positives are extremely rare.

Finally, I check calibration if the scores are used as probabilities, because resampling and class weights distort predicted probabilities."

### [1] MAE vs MSE vs RMSE vs R-squared?
@tags metrics, regression
@hook MAE: average miss, robust to outliers. MSE and RMSE: punish big misses more. R-squared: share of variance explained.
@say
"These are regression metrics.

Mean absolute error is the average absolute difference between predictions and actual values. It's in the target's units, easy to explain, like 'on average we're off by 12,000 rupees', and treats all errors linearly, so it's robust to outliers.

Mean squared error averages the squared differences, which heavily penalises large errors. That's useful when big misses are disproportionately bad. It's also smooth, which makes it convenient as a training loss. Root mean squared error is its square root, which brings it back into the target's units.

R-squared is the proportion of variance in the target that the model explains compared with always predicting the mean: 1 is perfect, 0 is no better than the mean, and it can be negative for a model worse than that.

I pick based on the business cost of errors: MAE if all errors cost about the same, RMSE if large errors are especially costly, and MAPE, percentage error, when relative error matters more, as long as targets aren't near zero."

### [1] Explain gradient descent and its variants.
@tags optimisation, gradient descent
@hook Walk downhill on the loss surface in small steps. Batch uses all data per step, SGD one example, mini-batch the practical middle.
@say
"Gradient descent minimises a loss function by repeatedly computing the gradient, the direction of steepest increase, and stepping the parameters a small amount in the opposite direction. The step size is the learning rate.

Batch gradient descent computes the gradient over the entire dataset for each step. It's stable but slow and memory-hungry for large data. Stochastic gradient descent uses one example per step: very noisy, but fast and the noise can help escape poor regions. Mini-batch gradient descent, which is what everyone actually uses, computes gradients on small batches, like 32 to a few thousand examples, balancing stability with efficiency on GPUs.

The learning rate is the most important hyperparameter. Too high and training diverges or oscillates; too low and it crawls or gets stuck. So we use schedules, like warmup followed by cosine decay, and adaptive optimisers. Momentum accumulates past gradients to speed through flat regions and dampen oscillation, and Adam combines momentum with per-parameter adaptive learning rates. AdamW, Adam with decoupled weight decay, is the default for training transformers."

### [1] How does logistic regression work? Why not use linear regression for classification?
@tags logistic regression, classification
@hook A linear score squashed through a sigmoid into a probability, trained with log loss.
@say
"Logistic regression computes a weighted sum of the features, a linear score, and passes it through the sigmoid function, which squashes any number into the range 0 to 1, interpreted as the probability of the positive class. It's trained by minimising log loss, also called binary cross-entropy, which heavily penalises confident wrong predictions. For more than two classes, softmax regression generalises it.

Linear regression isn't suitable for classification because its outputs aren't bounded, so you get 'probabilities' below 0 or above 1, and it's very sensitive to points far from the boundary, which shifts the decision line badly. Squared error is also the wrong loss for probabilities.

Logistic regression is still very useful: it's fast, its coefficients are interpretable as log-odds, it's well calibrated, and it's a strong baseline. I always train a simple baseline like this before reaching for anything complex, because it tells me how much the fancy model is really adding."

### [2] Decision trees vs random forests vs gradient boosting?
@tags trees, ensembles, xgboost
@hook One tree overfits. A forest averages many independent trees (bagging). Boosting builds trees one after another, each fixing the last one's errors.
@say
"A decision tree splits the data by asking a sequence of feature questions, choosing each split to make the resulting groups as pure as possible, measured by Gini impurity or entropy for classification. Trees are interpretable and handle mixed data types without scaling, but a single deep tree overfits badly: high variance.

A random forest trains many trees in parallel, each on a bootstrap sample of the data and considering a random subset of features at each split, then averages their predictions. That's bagging, and averaging many decorrelated trees greatly reduces variance. Random forests are robust and need little tuning.

Gradient boosting builds trees sequentially. Each new, shallow tree is trained to correct the errors, technically the gradient of the loss, of the ensemble so far, and its contribution is scaled by a learning rate. It reduces bias and usually achieves the best accuracy on tabular data, with libraries like XGBoost, LightGBM and CatBoost. It needs more careful tuning, and it can overfit if you add too many trees without early stopping.

For tabular business data, gradient-boosted trees remain the strongest default, often beating deep learning."

### [1] How does k-means clustering work, and how do you choose k?
@tags clustering, unsupervised
@hook Place k centres, assign points to the nearest, move centres to the mean, repeat. Choose k with the elbow method, silhouette score and business sense.
@say
"K-means partitions data into k clusters. It starts by placing k centroids, ideally with k-means++ initialisation, which spreads them out. Then it alternates two steps: assign every point to its nearest centroid, then move each centroid to the mean of its assigned points. It repeats until assignments stop changing. It minimises the within-cluster sum of squared distances.

To choose k, I use the elbow method, plotting that within-cluster error against k and looking for the point where adding clusters stops helping much; the silhouette score, which measures how well each point fits its own cluster versus the nearest other one; and, importantly, business usefulness: five customer segments the marketing team can act on beat twelve statistically perfect ones.

Its limitations: it assumes roughly spherical, similarly sized clusters, it's sensitive to feature scale, so I standardise first, and it's sensitive to outliers and initialisation, so it's run several times. For irregular shapes or noise, DBSCAN or HDBSCAN are better, and for soft assignments, Gaussian mixture models."

### [1] Normalisation vs standardisation? Which models need feature scaling?
@tags feature engineering, scaling
@hook Normalise to squeeze into 0 to 1; standardise to mean 0, standard deviation 1. Distance-based and gradient-based models care; trees don't.
@say
"Normalisation, or min-max scaling, rescales a feature into a fixed range, usually 0 to 1. It preserves the shape of the distribution but is sensitive to outliers, since one extreme value squashes everything else.

Standardisation, or z-score scaling, subtracts the mean and divides by the standard deviation, giving mean 0 and standard deviation 1. It's less distorted by outliers and is the usual default. For heavy outliers, robust scaling with the median and interquartile range is better.

Scaling matters for models that use distances or gradients: k-nearest neighbours, k-means, SVMs, PCA, and anything trained with gradient descent like linear models and neural networks, where unscaled features make optimisation slow and unstable. Tree-based models like random forests and gradient boosting don't need it, since splits only depend on ordering.

And critically, the scaler is fitted on the training data only and then applied to validation and test data, otherwise it's leakage."

### [2] What is the curse of dimensionality? How does PCA help?
@tags dimensionality reduction, pca
@hook In high dimensions, data gets sparse and distances stop meaning much. PCA keeps the few directions with most of the variance.
@say
"As the number of features grows, the volume of the space grows exponentially, so data becomes very sparse: you'd need exponentially more samples to cover the space. Distances also become less meaningful, because the nearest and farthest points end up at similar distances, which hurts distance-based methods like k-nearest neighbours and clustering. Models are also more prone to overfitting with many features and few samples.

PCA, principal component analysis, reduces dimensions by finding new orthogonal axes, the principal components, ordered by how much variance in the data they capture. You keep the top components that explain, say, 95 percent of the variance and drop the rest. It removes redundancy between correlated features, speeds up training, reduces noise and enables visualisation in 2D or 3D.

Its limits: it's linear, the components are hard to interpret, and maximum variance isn't always what's useful for prediction. For visualising complex structure, t-SNE or UMAP are better. And in the LLM world this matters directly: embeddings have hundreds or thousands of dimensions, which is why vector search uses approximate methods and why embedding models are often trained to support truncation to fewer dimensions."

### [2] Generative vs discriminative models?
@tags model types
@hook Discriminative models learn the boundary: P(y given x). Generative models learn how the data itself is produced, so they can create new samples.
@say
"A discriminative model learns the conditional probability of the label given the input, or directly a decision boundary between classes. Logistic regression, SVMs, gradient-boosted trees and most classifiers are discriminative. They're usually more accurate for pure prediction because they focus only on what separates the classes.

A generative model learns the distribution of the data itself, either the joint distribution of inputs and labels or just the inputs. Because it models how data is produced, it can generate new samples, handle missing data and estimate how likely an input is. Naive Bayes is a classic simple example; modern examples are large language models, which model the probability of text one token at a time, diffusion models for images, and VAEs.

LLMs blur the line in practice: a generative model can do discriminative tasks by generating the label, like answering 'positive' or 'negative' for sentiment, which is why one model can be adapted to so many tasks with prompting."

### [1] How do you handle missing data?
@tags data cleaning, feature engineering
@hook First ask why it's missing. Then drop, impute, or let the model handle it, and often add a "was missing" flag.
@say
"First I investigate why values are missing, because it changes the right fix. If it's completely random, simple methods are fine. If missingness depends on other features or on the value itself, like high earners skipping the income question, then missingness carries information.

Then the options. Drop rows, if only a few are affected and it's random, or drop columns that are mostly empty. Impute simple values: median for skewed numbers, mean, or the most frequent value or an explicit 'unknown' category for categoricals. Model-based imputation, like k-nearest neighbours or iterative imputation, when relationships between features are strong. Add a binary 'was missing' indicator feature, which lets the model learn from the missingness itself. Or use models that handle missing values natively, like XGBoost and LightGBM, which learn which branch missing values should go down.

Always fit imputers on training data only, inside the pipeline, to avoid leakage, and for time series use forward-fill rather than future values."

### [2] How do you choose a model for a new tabular prediction problem?
@tags model selection, workflow
@hook Baseline first, then gradient-boosted trees, then complexity only if the evals justify it.
@say
"I start with the problem framing and the metric that reflects the business cost, and a proper validation strategy, because the wrong split or metric invalidates everything after.

Then a trivial baseline, like predicting the majority class or the mean, and a simple interpretable model like logistic or linear regression. These tell me how hard the problem is and catch data problems early.

Next, gradient-boosted trees like LightGBM or XGBoost, which are the strongest general-purpose choice for tabular data: they handle mixed feature types, non-linearities, interactions and missing values with little preprocessing. I'd tune them with cross-validation and early stopping.

I'd only move to neural networks if there's a reason, like very large datasets, unstructured inputs such as text or images, or the need to combine modalities. Throughout, I spend more time on features and data quality than on model choice, since that's usually where the gains are. And the final pick weighs accuracy against latency, interpretability requirements, and how easy the model is to maintain and monitor."
