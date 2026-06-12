---
title: "Why Inference Economics Will Dictate AI Strategy for Leaders"
description: "The quiet pivot that matters more than another Google chip deal"
pubDate: 2026-04-22
author: jamie
readMinutes: 4
---

The quiet pivot that matters more than another Google chip deal

Buried in the story about Google talking to Marvell Technology about two new AI chips is a sentence that should stop every leader reading it. Google's next custom silicon is not being designed for training models. It is being designed for running them.

That is the shift worth sitting with. Training a frontier model is a one-off event. You pour in compute for a few weeks or months, and you end up with a model. Inference is what happens afterwards, every time a customer asks a question, every time a workflow runs on a user's behalf. Inference scales with demand, not with ambition. And it is quickly becoming the dominant cost of running AI at scale.

This is why Google is [in talks with Marvell for a memory processing unit and an inference-optimised TPU, adding a third design partner alongside Broadcom and MediaTek](https://thenextweb.com/news/google-marvell-ai-chips-inference-tpu-broadcom). Broadcom is already locked in through 2031. MediaTek handles the cheaper variants. Marvell would be the third. Google is diversifying the supply chain for the phase of AI that now costs the most, rather than replacing anyone.

For leaders outside the hyperscaler bubble, the implication is simple and slightly uncomfortable: the economics of AI are about to be dictated by inference, not by model capability. The question has moved from "can the model do this?" to "can we afford to run it, responsibly, at the volume our users demand?"

This is where a lot of boardroom AI strategies come unstuck. I have sat with senior teams who can recite the features of every frontier model but have not asked what it costs to serve a single query to a customer, or what the carbon implication looks like when that query gets made a hundred million times. [Google's Ironwood TPU, the seventh generation, delivers roughly ten times the peak performance of the TPU v5p](https://thenextweb.com/news/google-marvell-ai-chips-inference-tpu-broadcom) and scales to 9,216 liquid-cooled chips in a single superpod. That is not a consumer product. That is infrastructure for a world where AI is always on.

Three things follow from this that I would push any leadership team to sit with.

**Inference is where ethics actually meets users.** Training raises real questions about data provenance and bias, and those questions matter. But inference is the live system. It is the point at which a decision is generated, a recommendation is made, a piece of content is produced, a customer is approved or declined. If your governance work has focused on model selection and vendor due diligence, you have only covered the warm-up. The match starts at inference.

**Inference economics will expose lazy use cases.** When compute was notional and pilots were free, organisations could justify almost any AI experiment. The moment every query carries a unit cost, the weak use cases get quietly culled. You will see a sharp division between AI that creates measurable value and AI that was deployed because it was fashionable. This is healthy. It is also going to be uncomfortable for leaders who have not built the muscle of connecting AI activity to outcomes.

**Concentration is a governance question.** The [custom ASIC market is projected to grow 45% in 2026 and reach $118 billion by 2033](https://thenextweb.com/news/google-marvell-ai-chips-inference-tpu-broadcom). That kind of concentration of purpose-built infrastructure inside a handful of hyperscalers has consequences. If the chips running the models your organisation depends on are designed, fabricated, and operated by two or three companies, your strategic autonomy is thinner than your procurement contracts suggest. That is a board-level conversation, not an IT one.

What I take from the Marvell story is not a chip story at all. It is a signal that the AI economy is quietly maturing past the hype cycle into the ordinary, expensive, politically interesting business of running systems at scale. Training built the reputation. Inference is going to build the bill.

**One thing to try this week:** Find out exactly where your organisation has gaps, and how urgently you need to close them before AI adoption stalls or fails. If no one can answer, [here is your starting point](https://bykovbrett.net/ai-gap-analysis).
