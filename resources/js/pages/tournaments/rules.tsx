import { Head, useForm } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';
import type { FormEvent } from 'react';
import TournamentRuleController from '@/actions/App/Http/Controllers/TournamentRuleController';
import InputError from '@/components/input-error';
import { TournamentShell } from '@/components/tournament-shell';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import type { Tournament, TournamentRule } from '@/types/tournament';

type RuleRow = {
    key: string;
    id: number | null;
    template_key: string | null;
    text: string;
    value: string;
    is_active: boolean;
};

// Rules whose value comes from the tournament settings.
const SETTINGS_RULES = ['best_of'];

export default function Rules({
    tournament,
    rules,
}: {
    tournament: Tournament;
    rules: TournamentRule[];
}) {
    const form = useForm<{ rules: RuleRow[] }>(
        TournamentRuleController.update(tournament),
        {
            rules: rules.map((r) => ({
                key: `rule-${r.id}`,
                id: r.id,
                template_key: r.template_key,
                text: r.text,
                value: r.value ?? '',
                is_active: r.is_active,
            })),
        },
    );
    const errors = form.errors as Record<string, string | undefined>;

    const update = (index: number, changes: Partial<RuleRow>) =>
        form.setData(
            'rules',
            form.data.rules.map((r, i) =>
                i === index ? { ...r, ...changes } : r,
            ),
        );

    const addRule = () =>
        form.setData('rules', [
            ...form.data.rules,
            {
                key: `new-${Date.now()}`,
                id: null,
                template_key: null,
                text: '',
                value: '',
                is_active: true,
            },
        ]);

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.transform((data) => ({
            rules: data.rules.map(({ id, text, value, is_active }) => ({
                id,
                text,
                value,
                is_active,
            })),
        }));
        form.submit({ preserveScroll: true });
    };

    return (
        <>
            <Head title={`Reglas · ${tournament.name}`} />
            <TournamentShell tournament={tournament} section="Reglas">
                <form onSubmit={submit} className="space-y-4 pb-24">
                    <p className="text-sm text-muted-foreground">
                        Estas son las reglas sugeridas para{' '}
                        {tournament.variant_label ?? tournament.sport_label}.
                        Desmarca las que no uses, cambia los valores y agrega
                        las tuyas. En la página pública solo se ven las reglas
                        activas.
                    </p>

                    <ul className="divide-y rounded-2xl border bg-card">
                        {form.data.rules.map((rule, index) => (
                            <li
                                key={rule.key}
                                className={cn(
                                    'flex items-start gap-3 p-3',
                                    !rule.is_active && 'opacity-60',
                                )}
                            >
                                <Checkbox
                                    checked={rule.is_active}
                                    onCheckedChange={(v) =>
                                        update(index, { is_active: v === true })
                                    }
                                    className="mt-2"
                                    aria-label="Regla activa"
                                />
                                <div className="min-w-0 flex-1">
                                    {rule.template_key ? (
                                        <RuleText
                                            rule={rule}
                                            locked={SETTINGS_RULES.includes(
                                                rule.template_key,
                                            )}
                                            onValueChange={(value) =>
                                                update(index, { value })
                                            }
                                        />
                                    ) : (
                                        <Input
                                            value={rule.text}
                                            onChange={(e) =>
                                                update(index, {
                                                    text: e.target.value,
                                                })
                                            }
                                            placeholder="Escribe la regla"
                                            maxLength={500}
                                            autoFocus={rule.id === null}
                                        />
                                    )}
                                    <InputError
                                        message={
                                            errors[`rules.${index}.text`] ??
                                            errors[`rules.${index}.value`]
                                        }
                                    />
                                </div>
                                {!rule.template_key && (
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="ghost"
                                        aria-label="Quitar regla"
                                        onClick={() =>
                                            form.setData(
                                                'rules',
                                                form.data.rules.filter(
                                                    (_, i) => i !== index,
                                                ),
                                            )
                                        }
                                    >
                                        <Trash2 />
                                    </Button>
                                )}
                            </li>
                        ))}
                    </ul>

                    <Button type="button" variant="outline" onClick={addRule}>
                        <Plus /> Agregar regla
                    </Button>

                    <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 p-3 backdrop-blur md:sticky md:-mx-4 md:px-4">
                        <Button
                            type="submit"
                            size="lg"
                            className="w-full md:w-auto"
                            disabled={form.processing}
                        >
                            {form.processing && <Spinner />}
                            Guardar reglas
                        </Button>
                    </div>
                </form>
            </TournamentShell>
        </>
    );
}

/**
 * Rule text with its "{value}" placeholder turned into a small input.
 */
function RuleText({
    rule,
    locked,
    onValueChange,
}: {
    rule: RuleRow;
    locked: boolean;
    onValueChange: (value: string) => void;
}) {
    const [before, after] = rule.text.split('{value}');

    if (after === undefined) {
        return <p className="pt-1.5 text-sm">{rule.text}</p>;
    }

    return (
        <div className="text-sm leading-9">
            {before}
            <Input
                value={rule.value}
                onChange={(e) => onValueChange(e.target.value)}
                disabled={locked}
                inputMode="numeric"
                maxLength={50}
                className="mx-1 inline-flex h-8 w-16 px-2 text-center align-middle"
                aria-label="Valor de la regla"
            />
            {after}
            {locked && (
                <span className="block text-xs leading-4 text-muted-foreground">
                    Se cambia en Configuración.
                </span>
            )}
        </div>
    );
}
