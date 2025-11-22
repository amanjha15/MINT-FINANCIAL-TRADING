-- Add practice_start_date column to lessons table
ALTER TABLE public.lessons 
ADD COLUMN practice_start_date timestamptz DEFAULT '2024-12-02T00:00:00Z';

-- Update existing lessons to have the default start date
UPDATE public.lessons 
SET practice_start_date = '2024-12-02T00:00:00Z' 
WHERE practice_start_date IS NULL;