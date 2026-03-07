# Neptu.io 🌺

A Balinese Calendar (Wuku) Calculator for personal energy analysis based on traditional Balinese astrology.

## Overview

Neptu.io calculates your **POTENTIAL** (birth energy) and **OPPORTUNITY** (daily energy) using the traditional Balinese Pawukon calendar system. This 210-day cycle calendar has been used for centuries in Bali for determining auspicious days and understanding personal characteristics.

## Features

- 🎂 **POTENTIAL (Potensi)** - Birth date energy analysis
- 📅 **OPPORTUNITY (Peluang)** - Daily energy forecast
- 🧠 **Psychosocial Profile** - CIPTA, RASA, KARSA, TINDAKAN analysis
- ⚖️ **Health Indicators** - Panca Brahma (Yang) & Panca Tirta (Yin)
- 🔄 **Cycle Analysis** - Input/Process/Output phases
- ✨ **Affirmations** - Personalized affirmations based on gender patterns

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/neptu.io.git
cd neptu.io

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies (if any)
pip install -r requirements.txt
```

## Usage

### Command Line

```bash
python main.py
```

### As a Module

```python
from datetime import datetime
from main import NeptuCalculator

calc = NeptuCalculator()

# Calculate birth potential
birth_date = datetime(1990, 5, 15)
potential = calc.calculate_potensi(birth_date)

# Calculate daily opportunity
today = datetime.now()
opportunity = calc.calculate_peluang(today, birth_date)

# Get full reading
reading = calc.get_full_reading(birth_date, today)
```

## Calendar Elements

### Wara (Day Cycles)

| Wara       | Cycle    | Description                                    |
| ---------- | -------- | ---------------------------------------------- |
| Sapta Wara | 7 days   | Day of the week (Sunday-Saturday)              |
| Panca Wara | 5 days   | PAHING, UMANIS, KLIWON, WAGE, PON              |
| Sad Wara   | 6 days   | ARIYANG, TUNGLEH, MAULU, WAS, PANIRON, URUKUNG |
| Wuku       | 30 weeks | 30 different wuku in 210-day cycle             |

### Energy Profiles

| Profile      | Meaning      | Values                                                                        |
| ------------ | ------------ | ----------------------------------------------------------------------------- |
| **CIPTA**    | Psychosocial | TRUST, AUTONOMY, INITIATIVE, DILIGENT, IDENTITY, INTIMATE, DYNAMIC, INTEGRITY |
| **RASA**     | Emotional    | PEACE, APATHY, ANGER, GRIEF, PRIDE, PASSION, FEAR, FIRM, SINCERE              |
| **KARSA**    | Behavioral   | LISTENING, SHARING, EMPATHY, GESTURE(+), GENUINE                              |
| **TINDAKAN** | Action       | MINDFULNESS, WORSHIP, PROBIOTIC, SERVICE, CLEAN UP, DEEP SLEEP                |

### Frequency (Frekuensi)

| Name | Purpose    |
| ---- | ---------- |
| GURU | Guiding    |
| RATU | Protecting |
| LARA | Growing    |
| PATI | Releasing  |

## Project Structure

```
neptu.io/
├── main.py          # Core calculator logic
├── database.json    # Lookup tables and data
├── README.md        # This file
├── LICENSE          # MIT License
├── requirements.txt # Python dependencies
└── docs/            # Documentation
```

## Technical Details

### Epoch System

The calculator uses **September 17, 2005** as the reference epoch, calculating day values using:

```
DateValue = EPOCH - input_date
```

### Calculation Formulas

- **Sapta Wara**: `mod(DateValue, 7)`
- **Panca Wara**: `mod(DateValue, 5)`
- **Sad Wara**: `mod(DateValue, 6)`
- **Wuku**: `int(mod(DateValue, 210) / 7)`
- **CIPTA**: `mod(C24, 8)` where C24 = sapta_urip + panca_urip + sad_urip
- **RASA**: `mod(C24, 9)`
- **KARSA**: `mod(C24, 6)`
- **TINDAKAN**: `mod(C24, 6)`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Traditional Balinese calendar keepers and scholars
- The Balinese community for preserving this ancient wisdom

---

Made with 🙏 in Bali
