import { readFile } from "fs/promises";

type INISection = {
  [string: string]: INISection | INIKey;
}
type INIKey = { value?: string; default: string; description: string };

const RE_SECTION = /\[[\w\d\.]+\]/;

function trim(str) {
  return str.trim();
}

export class SimpleINI {
  readonly data: INISection;
  constructor(readonly filename: string) {
    this.data = {};
  }
  registerOption(name: string, data: INISection | INIKey) {
    this.data[name] = data;
  }
  async parse(filename?: string) {
    const actualFilename = filename ?? this.filename;
    const raw = await readFile(actualFilename, 'utf8');
    console.debug(`Loading config from ${actualFilename}`);
    let section: INIKey | INISection = this.data;
    for (const line of raw.split('\n').map(trim)) {
      if (line === '') continue;
      if (line.startsWith(';') || line.startsWith('#')) continue;
      if (line.match(RE_SECTION)) {
        section = this.data;
        for (const step in line.slice(1, line.length-1).split('.')) {
          section = section?.[step];
        }
        continue;
      }
      if (line.includes('=')) {
        const [key, value] = line.split('=').map(trim);
        if (typeof section?.[key] === 'object') {
          section[key].value = value;
        }
      }
    }
  }
  generateDefaultConfig() {
    const lines = [
      '; SAMPLE DEFAULT CONFIG',
      ''
    ];
    const sections = [];
    for (const key in this.data) {
      if (this.data[key].default !== undefined) {
        lines.push(...this.generateKeyConfig(key, this.data[key] as INIKey));
      } else {
        sections.push(key);
      }
    }
    for (const section of sections) {
      lines.push(...this.generateSectionConfig(section, this.data[section] as INISection));
    }
    return lines.join('\n');
  }
  private generateSectionConfig(path: string, data: INISection) {
    const lines = [
      `[${path}]`
    ];
    const sections = [];

    for (const key in data) {
      if (data[key].default !== undefined) {
        lines.push(...this.generateKeyConfig(key, data[key] as INIKey));
      } else {
        sections.push(key);
      }
    }
    lines.push('');
    for (const section of sections) {
      lines.push(...this.generateSectionConfig(`${path}.${section}`, data[section] as INISection));
      lines.push('');
    }

    return lines;
  }
  private generateKeyConfig(name: string, data: INIKey) {
    const lines = [
      `; ${data.description}`,
      `; ${name} = ${data.default}`,
      ''
    ];
    return lines;
  }
  getOption(path: string) {
    let temp: INIKey | INISection = this.data;
    let result: unknown;
    for (const step of path.split('.')) {
      temp = temp?.[step];
    }
    if (temp === undefined) {
      throw new Error(`Undefined Option: (${path})`);
    }
    result = temp.value;
    if (result === undefined) {
      result = temp.default;
    }
    if (typeof result !== 'string') {
      throw new Error('Section Requested');
    }
    return result;
  }
  getBool(path: string) {
    const val = this.getOption(path);
    if (val.toLowerCase() === 'true') return true;
    return false;
  }
  getInt(path: string) {
    return parseInt(this.getOption(path));
  }
  getFloat(path: string) {
    return parseFloat(this.getOption(path));
  }
}