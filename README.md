# MMM-OLYMPIC-MEDALS

A [MagicMirror²](https://github.com/MagicMirrorOrg/MagicMirror) module that displays Olympic medal standings by country.

This fork is based on the original project by **taylornoss**:  
https://github.com/taylornoss/MMM-OLYMPIC-MEDALS

---

## Features

- Shows Olympic medal data in a table (country, gold, silver, bronze, total).
- Supports both `summer` and `winter` Olympic games.
- Optional country abbreviation mode (`USA`, `NOR`, etc.).
- Configurable row limit and refresh interval.
- Automatic page flip between:
  - full medal table, and
  - a gold-sorted summary view.
- Built-in error state when season/year configuration is invalid.

---

## Requirements

- [MagicMirror²](https://github.com/MagicMirrorOrg/MagicMirror) (module requires `2.15.0` or newer)
- Node.js / npm environment used by your MagicMirror installation

---

## Installation

1. Open your MagicMirror `modules` directory:

   ```bash
   cd ~/MagicMirror/modules
   ```

2. Clone this repository:

   ```bash
   git clone <your-fork-url> MMM-OLYMPIC-MEDALS
   ```

3. Install dependencies:

   ```bash
   cd MMM-OLYMPIC-MEDALS
   npm install
   ```

4. Add the module to `~/MagicMirror/config/config.js`:

   ```js
   {
     module: "MMM-OLYMPIC-MEDALS",
     position: "top_right",
     config: {
       season: "summer",
       year: 2024,
       reloadInterval: 60 * 60 * 1000,
       tableSize: "xsmall",
       numOfRows: 10,
       useAbbreviations: false,
       pageFlipInterval: 15 * 1000
     }
   }
   ```

---

## Configuration

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `season` | `string` | `"summer"` | Olympic season. Allowed values: `"summer"`, `"winter"`. |
| `year` | `number` \| `string` | `2024` | Olympic year to display. Must match validation rules below. |
| `reloadInterval` | `number` | `3600000` | Data refresh interval in milliseconds. |
| `tableSize` | `string` | `"xsmall"` | Font size class for table rendering (`xsmall`, `small`, `medium`, `large`, `xlarge`). |
| `numOfRows` | `number` | `10` | Maximum number of countries shown. |
| `useAbbreviations` | `boolean` | `false` | Show country abbreviations instead of full country names. |
| `pageFlipInterval` | `number` | `15000` | Interval in milliseconds for flipping between the two table pages. |

### Season/year validation rules

The module validates season and year before requesting medal data:

- **Summer Olympics**: year must be divisible by 4.
- **Winter Olympics**: year must be congruent to 2 modulo 4 (e.g., 2022, 2026).

If validation fails, the module shows a configuration error message in the UI and logs details to the MagicMirror console.

---

## Notes

- Medal data is fetched from ESPN and parsed by this module.
- If ESPN changes page structure, parser updates may be required.
- During games that have not started or before medals are awarded, the module may show a “No Medals Awarded Yet” state.

---

## Original project / attribution

This repository is a fork of:

- **taylornoss/MMM-OLYMPIC-MEDALS**  
  https://github.com/taylornoss/MMM-OLYMPIC-MEDALS

Please credit the original author when redistributing or building further forks.

---

## License

MIT
