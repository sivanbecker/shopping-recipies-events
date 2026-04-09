-- Migration 017: Remove אחר (Other) category

DELETE FROM public.categories WHERE name_he = 'אחר';
