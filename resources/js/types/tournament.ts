export type SportValue = 'football' | 'volleyball' | 'basketball';
export type TournamentFormat = 'league' | 'knockout' | 'groups_knockout';
export type TournamentStatus =
    | 'draft'
    | 'registration_open'
    | 'in_progress'
    | 'finished';
export type TeamStatus = 'approved' | 'pending';

export type Option = {
    value: string;
    label: string;
};

export type SportOption = {
    value: SportValue;
    label: string;
    variants: Record<string, string>;
    allowsDraw: boolean;
    usesSets: boolean;
    scoreUnit: string;
    defaultSettings: TournamentSettings;
    pointLabels: Record<string, string>;
    standingsColumns: Record<string, string>;
};

export type TournamentOptions = {
    sports: SportOption[];
    formats: Option[];
    statuses: Option[];
    tiebreakers: Option[];
};

export type TournamentSettings = {
    points: Record<string, number>;
    best_of?: number;
    groups_count?: number;
    qualifiers_per_group?: number;
};

export type Tournament = {
    id: number;
    user_id: number;
    name: string;
    slug: string;
    sport: SportValue;
    sport_label: string;
    variant: string | null;
    variant_label: string | null;
    description: string | null;
    start_date: string;
    location: string | null;
    format: TournamentFormat;
    format_label: string;
    status: TournamentStatus;
    status_label: string;
    double_round: boolean;
    public_registration: boolean;
    max_teams: number | null;
    settings: TournamentSettings;
    tiebreakers: string[];
    teams_count?: number;
};

export type Team = {
    id: number;
    name: string;
    color: string | null;
    logo_url: string | null;
    contact_name?: string | null;
    status?: TeamStatus;
};

export type TournamentRule = {
    id: number;
    template_key: string | null;
    text: string;
    value: string | null;
    is_active: boolean;
    display_text: string;
};

export type GameStatus = 'scheduled' | 'live' | 'finished';
export type GameStage = 'league' | 'group' | 'knockout';

export type GameTeam = Pick<Team, 'id' | 'name' | 'color' | 'logo_url'>;

export type Game = {
    id: number;
    stage: GameStage;
    group_id: number | null;
    group_name: string | null;
    round: number;
    round_label: string;
    bracket_position: number | null;
    scheduled_at: string | null;
    venue: string | null;
    status: GameStatus;
    status_label: string;
    home_score: number;
    away_score: number;
    sets: { home: number; away: number }[] | null;
    home_penalties: number | null;
    away_penalties: number | null;
    winner_team_id: number | null;
    home_team_id: number | null;
    away_team_id: number | null;
    next_game_id: number | null;
    next_slot: 'home' | 'away' | null;
    home_team: GameTeam | null;
    away_team: GameTeam | null;
};

export type ScheduleRound = {
    round: number;
    label: string;
    games: Game[];
    resting: string[];
};

export type ScheduleStage = {
    stage: GameStage;
    title: string;
    rounds: ScheduleRound[];
};

export type ScheduleOptionsData = {
    starts_at: string;
    game_minutes: number;
    courts: number;
    court_names: string;
    days_between_rounds: number;
};
