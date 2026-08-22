-- Replace "primary medium" with "exhibition / sales history" on artist
-- applications — a better signal for evaluating a prospective artist.
alter table artist_applications rename column medium to exhibition_history;
