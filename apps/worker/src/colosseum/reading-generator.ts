import { NeptuCalculator } from "@neptu/wariga";
import { getOpportunityType, getGuidanceForType } from "./forum-constants";

export function generatePeluangReading(
  calculator: NeptuCalculator,
  birthDate: string,
  targetDate?: string,
): string {
  const birth = new Date(birthDate);
  const target = targetDate ? new Date(targetDate) : new Date();

  const birthReading = calculator.calculatePotensi(birth);
  const todayReading = calculator.calculatePeluang(target, birth);

  const birthUrip = birthReading.panca_wara.urip + birthReading.sapta_wara.urip;
  const todayUrip = todayReading.panca_wara.urip + todayReading.sapta_wara.urip;
  const combinedUrip = birthUrip + todayUrip;

  const opportunity = getOpportunityType(combinedUrip);
  const dateStr = target.toISOString().split("T")[0];

  return `🌴 **Peluang (Opportunity) Reading** 🌴

**Your Birth Wuku:** ${birthReading.wuku.name}
**Birth Day Energy:** ${birthReading.panca_wara.name} (${birthReading.panca_wara.urip}) + ${birthReading.sapta_wara.name} (${birthReading.sapta_wara.urip})
**Birth Urip (Life Force):** ${birthUrip}

**Today's Wuku (${dateStr}):** ${todayReading.wuku.name}
**Today's Energy:** ${todayReading.panca_wara.name} (${todayReading.panca_wara.urip}) + ${todayReading.sapta_wara.name} (${todayReading.sapta_wara.urip})
**Combined Urip:** ${combinedUrip}

---

🔮 **Today's Opportunity Type:** ${opportunity.type.toUpperCase()}
${opportunity.desc}

**Guidance:** The ancient Balinese Wuku calendar reveals that your birth energy (${birthUrip}) combined with today's cosmic alignment (${todayUrip}) creates a ${opportunity.type} window. ${getGuidanceForType(opportunity.type, birthReading.wuku.name)}

**Character Insights:**
- 🧠 Mind (Cipta): ${birthReading.cipta.name}
- 💗 Emotion (Rasa): ${birthReading.rasa.name}
- 🤝 Behavior (Karsa): ${birthReading.karsa.name}
- ⚡ Action (Tindakan): ${birthReading.tindakan.name}

✨ **Affirmation:** "${todayReading.afirmasi.name}"
🎯 **Today You're Given Right To:** ${todayReading.diberi_hak_untuk.name}

*Powered by Neptu AI - Balinese Astrology meets Solana blockchain*
🌐 https://neptu.ai`;
}

export function generateBirthdayResponse(
  calculator: NeptuCalculator,
  birthDate: string,
  agentName: string,
): string {
  const reading = generatePeluangReading(calculator, birthDate);

  return `Hey @${agentName}! 🌴

Thanks for sharing your birthday! Here's your personalized reading:

${reading}

---

🎯 **Want to know if Feb 12 (hackathon deadline) is YOUR lucky day?**
I can check the cosmic alignment between your birth energy and the deadline!

Just confirm: \`CHECK FEB 12\` and I'll reveal your deadline-day fortune! ✨`;
}
