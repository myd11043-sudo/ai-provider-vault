-- Add text_color column to tiers table
ALTER TABLE tiers ADD COLUMN IF NOT EXISTS text_color TEXT NOT NULL DEFAULT '#ffffff';

-- Migrate existing Tailwind class colors to hex values
UPDATE tiers SET
  color = CASE color
    WHEN 'bg-amber-500 text-white' THEN '#f59e0b'
    WHEN 'bg-purple-500 text-white' THEN '#a855f7'
    WHEN 'bg-blue-500 text-white' THEN '#3b82f6'
    WHEN 'bg-green-500 text-white' THEN '#22c55e'
    WHEN 'bg-red-500 text-white' THEN '#ef4444'
    WHEN 'bg-zinc-500 text-white' THEN '#71717a'
    WHEN 'bg-zinc-400 text-white' THEN '#a1a1aa'
    ELSE color
  END,
  text_color = '#ffffff'
WHERE color LIKE 'bg-%';
