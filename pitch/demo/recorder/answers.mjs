/* Candidate answers for the demo interview.
   Each is matched to one of the four published questions. They are spoken by
   OpenAI TTS and fed into the browser as the microphone track, so the platform
   transcribes real audio with gpt-4o-transcribe rather than receiving typed text.
   The final video has no audio track вЂ” the voice exists only to drive the pipeline. */

export const ANSWERS = [
  {
    key: "sql",
    match: /SQL|warehouse data|validate the result/i,
    text:
      "Last year our weekly G M V dashboard disagreed with finance by about four percent. " +
      "I rebuilt the query from the raw order events and found we were double counting refunded orders " +
      "that had later been re-captured. I added a reconciliation test that compares the warehouse total " +
      "to the payment provider every day. The gap closed to under zero point three percent, and that test " +
      "has caught two upstream bugs since.",
  },
  {
    key: "economics",
    match: /revenue, pricing|unit-economics decision|trade-offs did you evaluate/i,
    text:
      "We were deciding whether to cut the take rate on our largest merchant category from twelve percent to nine. " +
      "I modelled contribution margin per order against the volume lift we would need just to break even, " +
      "which came out at about thirty one percent. Cohort data showed realistic lift closer to eighteen, " +
      "so I recommended a targeted discount for new merchants only. Margin held, and merchant churn fell by a fifth.",
  },
  {
    key: "stakeholder",
    match: /non-technical stakeholder|uncertainty|next action/i,
    text:
      "Our commercial director wanted one number for payback. I gave him a single slide. " +
      "Median payback was five point two months, the range across channels was three to nine months, " +
      "and the driver was second order repeat rate. I said plainly which part I was confident in and which part " +
      "was an estimate on thin data, and I recommended holding the paid budget flat for one more cohort before scaling.",
  },
  {
    key: "ownership",
    match: /responsibility beyond the initial request|clarify, follow up/i,
    text:
      "I was asked to pull a churn list. While pulling it I noticed that most churned merchants had failed their first payout. " +
      "That was not the question I had been given, so I checked with the payments team, quantified it at roughly " +
      "forty percent of first month churn, and brought it to the weekly review. We changed the payout retry logic, " +
      "and first month churn dropped by nine points over the following quarter.",
  },
];

/* Used when the router asks an unplanned evidence probe. */
export const PROBE_ANSWERS = [
  "To be specific about my own part: I wrote the query and the reconciliation test myself, " +
    "and I agreed the tolerance threshold with the finance lead before we shipped it. " +
    "The measurable outcome was the variance dropping from four percent to under zero point three.",
  "The alternative I rejected was applying the change across every merchant tier. " +
    "The model said that would cost us about two hundred thousand dollars a quarter in margin " +
    "for volume we had no evidence we would actually get, so I limited it to new merchants and set a review date.",
];
