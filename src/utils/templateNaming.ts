// Utility for generating smart template names with versioning & date context

export interface GenerateTemplateNameOptions {
  existingNames: string[]; // existing template_name values (case-insensitive unique check)
  baseSessionName?: string | null;
  date?: Date;
}

const SPLIT_KEYWORDS = ['push','pull','legs','full body','upper','lower','chest','back','arms','shoulders','core'];

export function generateTemplateName(opts: GenerateTemplateNameOptions): string {
  const { existingNames, baseSessionName, date = new Date() } = opts;
  const lowerExisting = new Set(existingNames.map(n=>n.toLowerCase()));

  const monthShort = date.toLocaleString('en-US', { month: 'short' });
  const year = date.getFullYear();
  const day = date.getDate();

  // Derive base
  let base = 'Workout';
  if(baseSessionName){
    base = baseSessionName.trim();
  }
  // Ensure split keyword preserved (capitalization kept if present)
  const lowerBase = base.toLowerCase();
  const foundSplit = SPLIT_KEYWORDS.find(k=>lowerBase.includes(k));
  if(foundSplit){
    // leave base as-is
  }

  let candidate = `${base} Template`;
  const dateTag = `(${monthShort} ${year})`;

  const ensureUnique = (name: string): string => {
    if(!lowerExisting.has(name.toLowerCase())) return name;
    // If same base with date tag helps uniqueness
    let withDate = `${base} Template ${dateTag}`;
    if(!lowerExisting.has(withDate.toLowerCase())) return withDate;
    // version suffix
    let v = 2;
    while(true){
      const ver = `${base} Template v${v}`;
      if(!lowerExisting.has(ver.toLowerCase())) return ver;
      v++;
      if(v>50) return `${base} Template ${day}-${monthShort}-${year}`; // fallback safety
    }
  };

  candidate = ensureUnique(candidate);
  return candidate;
}
