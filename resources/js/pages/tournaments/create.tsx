import { Head } from '@inertiajs/react';
import TournamentController from '@/actions/App/Http/Controllers/TournamentController';
import Heading from '@/components/heading';
import { TournamentForm } from '@/components/tournament-form';
import { dashboard } from '@/routes';
import type { SportValue, TournamentOptions } from '@/types/tournament';

export default function CreateTournament({
    options,
    defaults,
}: {
    options: TournamentOptions;
    defaults: {
        sport: SportValue;
        status: string;
        tiebreakers: string[];
        start_date: string;
    };
}) {
    const sport = options.sports.find((s) => s.value === defaults.sport)!;

    return (
        <>
            <Head title="Nuevo torneo" />
            <div className="w-full max-w-3xl p-4">
                <Heading
                    title="Nuevo torneo"
                    description="Elige el deporte y el formato. Podrás cambiar todo después."
                />
                <TournamentForm
                    options={options}
                    action={TournamentController.store()}
                    submitLabel="Crear torneo"
                    initial={{
                        name: '',
                        sport: defaults.sport,
                        variant: Object.keys(sport.variants)[0] ?? null,
                        description: '',
                        start_date: defaults.start_date,
                        location: '',
                        format: 'league',
                        status: defaults.status,
                        double_round: false,
                        public_registration: false,
                        max_teams: '',
                        points: sport.defaultSettings.points,
                        best_of: sport.defaultSettings.best_of ?? 3,
                        groups_count: 2,
                        qualifiers_per_group: 2,
                        tiebreakers: defaults.tiebreakers,
                    }}
                />
            </div>
        </>
    );
}

CreateTournament.layout = {
    breadcrumbs: [
        { title: 'Panel', href: dashboard() },
        { title: 'Nuevo torneo', href: '' },
    ],
};
