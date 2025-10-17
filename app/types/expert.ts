export interface ExpertSearchQuery {
  isExpert: boolean;
  $or?: Array<{
    name?: { $regex: string; $options: string };
    expertSpecialty?: { $regex: string; $options: string };
  }>;
}