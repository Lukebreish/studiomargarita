-- Studio Margarita — migrates the site's current hardcoded content into the
-- new tables. Run this AFTER 001_initial_schema.sql, once, in the SQL Editor.
-- Safe to re-run: it deletes and re-inserts by known id/title rather than
-- blindly appending duplicates.

delete from artworks;
delete from artists;

insert into artists (id, name, country, image_url, bio_note, sort_order) values
  ('anastasiia', 'Anastasiia', 'Russia', '/artists/anastasiia.jpg', 'Anastasiia paints like she''s arguing with the canvas — and winning. Placeholder note, replace with Margarita''s words.', 1),
  ('rayan', 'Rayan', 'Australia', '/artists/rayan.jpg', 'There''s a stillness in how Rayan builds a face, layer by layer, that most painters rush past. Placeholder note, replace with Margarita''s words.', 2),
  ('ellisar', 'Ellisar', 'Lebanon', '/artists/ellisar.jpg', 'Ellisar''s colour sense is fearless — she''ll put two shades next to each other that shouldn''t work, and they do. Placeholder note, replace with Margarita''s words.', 3),
  ('elizaveta', 'Elizaveta', 'Russia', '/artists/elizaveta.jpg', 'Elizaveta has an eye for the quiet moment — the one everyone else would have cropped out. Placeholder note, replace with Margarita''s words.', 4);

-- The 5 pieces used by the 3D virtual tour (tour_room/tour_wall/aspect set).
-- All attributed to Ellisar (previously mislabeled as "Margarita" — she's the
-- curator, not an artist).
insert into artworks (artist_id, title, image_url, medium, note, featured, tour_room, tour_wall, aspect, sort_order) values
  ('ellisar', 'Behind My Hand', '/paintings/behind-my-hand.jpg', 'Oil on canvas', 'A study in obscured self-portraiture — colour standing in for what the hand hides.', true, 0, 'left', 1058.0/732.0, 1),
  ('ellisar', 'River Fable', '/paintings/river-fable.jpg', 'Acrylic on canvas', 'A dense, folkloric scene — figure, fish, and foliage read as one continuous body.', true, 0, 'right', 1076.0/744.0, 2),
  ('ellisar', 'Nocturne', '/paintings/nocturne.jpg', 'Digital painting', 'A single wing rendered in close, patient detail against the dark.', true, 1, 'left', 954.0/663.0, 3),
  ('ellisar', 'The Procession', '/paintings/the-procession.jpg', 'Oil on canvas', 'A crowd dissolves into colour and rhythm — movement painted as pattern.', true, 1, 'right', 1101.0/619.0, 4),
  ('ellisar', 'Martyrs'' Square', '/paintings/martyrs-square.jpg', 'Oil on canvas', 'Beirut, mid-uprising — the city''s landmarks held inside a sky full of colour and flight.', false, 2, 'back', 1020.0/510.0, 5);

-- Rayan — pulled from his own shop, real prices/sizes/mediums.
insert into artworks (artist_id, title, image_url, medium, size, price, status, sort_order) values
  ('rayan', 'Smiling Staffy', '/artist-works/rayan/smiling-staffy.jpg', 'Oil painting', null, 800, 'sold', 1),
  ('rayan', 'Still Life - Before Pharmacies, There Were Kitchens', '/artist-works/rayan/still-life-before-pharmacies.webp', 'Oil on linen', '41 x 50.5 cm', 1200, 'available', 2),
  ('rayan', 'Still Life', '/artist-works/rayan/still-life.webp', 'Oil on canvas on compressed cardboard support', '25 x 35 cm', 450, 'available', 3),
  ('rayan', 'Forbidden Fruit', '/artist-works/rayan/forbidden-fruit.webp', 'Oil on canvas', '30 x 40 cm', 1400, 'available', 4),
  ('rayan', 'Within', '/artist-works/rayan/within-charcoal-portrait.webp', 'Charcoal on paper', '30 x 40 cm', 650, 'available', 5),
  ('rayan', 'The Artist, Looking Back - Self Portrait', '/artist-works/rayan/the-artist-looking-back.webp', 'Charcoal on paper', '30 x 40 cm', 850, 'available', 6),
  ('rayan', 'Charcoal Portrait - Mysterious Man', '/artist-works/rayan/charcoal-portrait-mysterious-man.webp', 'Charcoal on paper', '31 x 38.5 cm', 450, 'available', 7),
  ('rayan', 'Reflection', '/artist-works/rayan/reflection.webp', 'Oil on linen', '85 x 105 cm (framed: 95 x 115 cm)', 7000, 'available', 8);

-- Ellisar — pulled from her Behance portfolio. No listed prices (shows "on
-- enquiry" until you set real ones).
insert into artworks (artist_id, title, image_url, medium, sort_order) values
  ('ellisar', 'Orange Phase I', '/artist-works/ellisar/orange-phase-i.webp', 'Oil on canvas', 10),
  ('ellisar', 'Orange Phase II', '/artist-works/ellisar/orange-phase-ii.webp', 'Oil on canvas', 11),
  ('ellisar', 'Orange Phase III', '/artist-works/ellisar/orange-phase-iii.webp', 'Oil on canvas', 12),
  ('ellisar', 'Rebellious I', '/artist-works/ellisar/rebellious-i.webp', 'Painting', 13),
  ('ellisar', 'Rebellious II', '/artist-works/ellisar/rebellious-ii.webp', 'Painting', 14),
  ('ellisar', 'I Am From There', '/artist-works/ellisar/i-am-from-there.webp', 'Mixed media (collage & painting)', 15),
  ('ellisar', 'Digital Painting I', '/artist-works/ellisar/digital-paintings-i.webp', 'Digital painting', 16),
  ('ellisar', 'Digital Painting II', '/artist-works/ellisar/digital-paintings-ii.webp', 'Digital painting', 17),
  ('ellisar', 'Digital Painting III', '/artist-works/ellisar/digital-paintings-iii.webp', 'Digital painting', 18),
  ('ellisar', 'Genetically Modified I', '/artist-works/ellisar/genetically-modified-i.webp', 'Mixed media on canvas', 19),
  ('ellisar', 'Genetically Modified II', '/artist-works/ellisar/genetically-modified-ii.webp', 'Mixed media on canvas', 20),
  ('ellisar', 'Genetically Modified III', '/artist-works/ellisar/genetically-modified-iii.webp', 'Mixed media on canvas', 21),
  ('ellisar', 'Genetically Modified IV', '/artist-works/ellisar/genetically-modified-iv.webp', 'Mixed media on canvas', 22),
  ('ellisar', 'Genetically Modified V', '/artist-works/ellisar/genetically-modified-v.webp', 'Mixed media on canvas', 23);
