export interface Scores {
  [key: string]: number;  // sectorId -> score
}

export interface ScoresByDate {
  [key: string]: Scores;  // dateString -> Scores
}