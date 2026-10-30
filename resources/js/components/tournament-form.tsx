import { useForm } from '@inertiajs/react';
import type { UrlMethodPair } from '@inertiajs/core';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';
import InputError from '@/components/input-error';
import { SportIcon } from '@/components/sport-icon';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { setResultExamples } from '@/lib/format';
import { cn } from '@/lib/utils';
import type {
    SportOption,
    SportValue,
    TournamentOptions,
} from '@/types/tournament';

export type TournamentFormData = {
    name: string;
    slug?: string;
    sport: SportValue;
    variant: string | null;
    description: string;
    start_date: string;
    location: string;
    format: string;
    status: string;
    double_round: boolean;
    public_registration: boolean;
    max_teams: string;
    points: Record<string, number>;
    best_of: number;
    groups_count: number;
    qualifiers_per_group: number;
    tiebreakers: string[];
};

const formatDescriptions: Record<string, string> = {
    league: 'Todos juegan contra todos. Gana quien sume más puntos.',
    knockout: 'Partidos de eliminación directa hasta la final.',
    groups_knockout:
        'Fase de grupos y los mejores de cada grupo pasan a la eliminatoria.',
};

export function TournamentForm({
    options,
    initial,
    action,
    submitLabel,
    locked = false,
    publicBaseUrl,
}: {
    options: TournamentOptions;
    initial: TournamentFormData;
    action: UrlMethodPair;
    submitLabel: string;
    /** The schedule exists: sport and format can no longer change. */
    locked?: boolean;
    /** Shows the slug field (edit only). */
    publicBaseUrl?: string;
}) {
    const form = useForm<TournamentFormData>(action, initial);
    const { data, setData, processing } = form;
    const errors = form.errors as Record<string, string | undefined>;
    const sport = options.sports.find(
        (s) => s.value === data.sport,
    ) as SportOption;

    const changeSport = (value: SportValue) => {
        const next = options.sports.find((s) => s.value === value)!;
        const variants = Object.keys(next.variants);

        setData({
            ...data,
            sport: value,
            variant: variants.length ? variants[0] : null,
            points: next.defaultSettings.points,
            best_of: next.defaultSettings.best_of ?? 3,
        });
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.submit({ preserveScroll: true });
    };

    return (
        <form onSubmit={submit} className="space-y-6 pb-24">
            <Section title="Deporte">
                <div className="grid grid-cols-3 gap-2">
                    {options.sports.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            disabled={locked}
                            onClick={() => changeSport(option.value)}
                            className={cn(
                                'flex flex-col items-center gap-2 rounded-xl border-2 p-3 text-sm font-medium transition-colors disabled:opacity-60',
                                data.sport === option.value
                                    ? 'border-brand bg-brand/10 text-brand dark:text-blue-300'
                                    : 'border-border hover:border-brand/40',
                            )}
                        >
                            <SportIcon
                                sport={option.value}
                                className="size-7"
                            />
                            {option.label}
                        </button>
                    ))}
                </div>
                <InputError message={errors.sport} />

                {Object.keys(sport.variants).length > 0 && (
                    <Field label="Variante" error={errors.variant}>
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(sport.variants).map(
                                ([value, label]) => (
                                    <Chip
                                        key={value}
                                        active={data.variant === value}
                                        disabled={locked}
                                        onClick={() =>
                                            setData('variant', value)
                                        }
                                    >
                                        {label}
                                    </Chip>
                                ),
                            )}
                        </div>
                    </Field>
                )}
            </Section>

            <Section title="Datos generales">
                <Field
                    label="Nombre del torneo"
                    htmlFor="name"
                    error={errors.name}
                >
                    <Input
                        id="name"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        placeholder="Liga Colonia 2026"
                        required
                        maxLength={100}
                    />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                        label="Fecha de inicio"
                        htmlFor="start_date"
                        error={errors.start_date}
                    >
                        <Input
                            id="start_date"
                            type="date"
                            value={data.start_date}
                            onChange={(e) =>
                                setData('start_date', e.target.value)
                            }
                            required
                        />
                    </Field>
                    <Field
                        label="Lugar (opcional)"
                        htmlFor="location"
                        error={errors.location}
                    >
                        <Input
                            id="location"
                            value={data.location}
                            onChange={(e) =>
                                setData('location', e.target.value)
                            }
                            placeholder="Cancha municipal"
                            maxLength={150}
                        />
                    </Field>
                </div>
                <Field
                    label="Descripción (opcional)"
                    htmlFor="description"
                    error={errors.description}
                >
                    <Textarea
                        id="description"
                        value={data.description}
                        onChange={(e) => setData('description', e.target.value)}
                        placeholder="Cuéntales a los equipos de qué se trata el torneo"
                        rows={3}
                        maxLength={2000}
                    />
                </Field>
            </Section>

            <Section title="Formato">
                <div className="space-y-2">
                    {options.formats.map((format) => (
                        <label
                            key={format.value}
                            className={cn(
                                'flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3 transition-colors',
                                data.format === format.value
                                    ? 'border-brand bg-brand/5'
                                    : 'border-border',
                                locked && 'cursor-not-allowed opacity-60',
                            )}
                        >
                            <input
                                type="radio"
                                name="format"
                                value={format.value}
                                checked={data.format === format.value}
                                disabled={locked}
                                onChange={() => setData('format', format.value)}
                                className="mt-1 accent-[var(--color-brand)]"
                            />
                            <span>
                                <span className="block text-sm font-medium">
                                    {format.label}
                                </span>
                                <span className="block text-sm text-muted-foreground">
                                    {formatDescriptions[format.value]}
                                </span>
                            </span>
                        </label>
                    ))}
                </div>
                <InputError message={errors.format} />

                {data.format === 'league' && (
                    <CheckField
                        id="double_round"
                        checked={data.double_round}
                        disabled={locked}
                        onChange={(v) => setData('double_round', v)}
                        label="Ida y vuelta"
                        hint="Cada pareja de equipos se enfrenta dos veces."
                    />
                )}

                {data.format === 'groups_knockout' && (
                    <div className="grid grid-cols-2 gap-4">
                        <Field
                            label="Cantidad de grupos"
                            htmlFor="groups_count"
                            error={errors.groups_count}
                        >
                            <Input
                                id="groups_count"
                                type="number"
                                min={2}
                                max={16}
                                value={data.groups_count}
                                disabled={locked}
                                onChange={(e) =>
                                    setData(
                                        'groups_count',
                                        Number(e.target.value),
                                    )
                                }
                            />
                        </Field>
                        <Field
                            label="Clasifican por grupo"
                            htmlFor="qualifiers_per_group"
                            error={errors.qualifiers_per_group}
                        >
                            <Input
                                id="qualifiers_per_group"
                                type="number"
                                min={1}
                                max={4}
                                value={data.qualifiers_per_group}
                                disabled={locked}
                                onChange={(e) =>
                                    setData(
                                        'qualifiers_per_group',
                                        Number(e.target.value),
                                    )
                                }
                            />
                        </Field>
                    </div>
                )}

                {locked && (
                    <p className="text-sm text-muted-foreground">
                        El calendario ya fue generado: el deporte y el formato
                        no se pueden cambiar.
                    </p>
                )}
                <InputError
                    message={
                        errors.double_round ??
                        errors.variant ??
                        errors.best_of ??
                        errors.groups_count
                    }
                />
            </Section>

            <Section
                title="Puntuación"
                description="Puntos que suma cada equipo en la tabla de posiciones."
            >
                {sport.usesSets && (
                    <Field label="Partidos a" error={errors.best_of}>
                        <div className="flex gap-2">
                            {[3, 5].map((n) => (
                                <Chip
                                    key={n}
                                    active={data.best_of === n}
                                    disabled={locked}
                                    onClick={() => setData('best_of', n)}
                                >
                                    Mejor de {n} sets
                                </Chip>
                            ))}
                        </div>
                    </Field>
                )}
                <div className="divide-y rounded-xl border">
                    {Object.entries(sport.pointLabels).map(([key, label]) => (
                        <div
                            key={key}
                            className="flex items-center justify-between gap-3 px-3 py-2"
                        >
                            <Label
                                htmlFor={`points-${key}`}
                                className="block text-sm leading-snug"
                            >
                                {label}
                                {sport.usesSets && (
                                    <span className="ml-1 text-muted-foreground">
                                        ({setResultExamples(data.best_of)[key]})
                                    </span>
                                )}
                            </Label>
                            <Input
                                id={`points-${key}`}
                                type="number"
                                min={0}
                                max={10}
                                inputMode="numeric"
                                className="w-16 text-center"
                                value={data.points[key] ?? 0}
                                onChange={(e) =>
                                    setData('points', {
                                        ...data.points,
                                        [key]: Number(e.target.value),
                                    })
                                }
                            />
                        </div>
                    ))}
                </div>
                <InputError
                    message={Object.entries(errors)
                        .filter(([k]) => k.startsWith('points'))
                        .map(([, v]) => v)
                        .find(Boolean)}
                />
            </Section>

            <Section
                title="Criterios de desempate"
                description="Si dos equipos empatan en la tabla, se ordenan con estos criterios, de arriba hacia abajo."
            >
                <TiebreakerList
                    options={options.tiebreakers}
                    value={data.tiebreakers}
                    onChange={(v) => setData('tiebreakers', v)}
                />
                <InputError message={errors.tiebreakers} />
            </Section>

            <Section title="Inscripciones">
                <CheckField
                    id="public_registration"
                    checked={data.public_registration}
                    onChange={(v) => setData('public_registration', v)}
                    label="Inscripción por enlace público"
                    hint="Cualquiera puede inscribir un equipo sin crear cuenta. Quedará pendiente hasta que lo apruebes."
                />
                <Field
                    label="Máximo de equipos (opcional)"
                    htmlFor="max_teams"
                    error={errors.max_teams}
                >
                    <Input
                        id="max_teams"
                        type="number"
                        min={2}
                        max={128}
                        inputMode="numeric"
                        className="w-28"
                        value={data.max_teams}
                        onChange={(e) => setData('max_teams', e.target.value)}
                        placeholder="Sin límite"
                    />
                </Field>
            </Section>

            <Section title="Estado">
                <Field
                    label="Estado del torneo"
                    htmlFor="status"
                    error={errors.status}
                >
                    <NativeSelect
                        id="status"
                        value={data.status}
                        onChange={(e) => setData('status', e.target.value)}
                    >
                        {options.statuses.map((s) => (
                            <option key={s.value} value={s.value}>
                                {s.label}
                            </option>
                        ))}
                    </NativeSelect>
                </Field>
                <p className="text-sm text-muted-foreground">
                    En borrador, el torneo no aparece en las páginas públicas.
                </p>
                {publicBaseUrl !== undefined && (
                    <Field label="Enlace público" error={errors.slug}>
                        <div className="flex items-center rounded-md border focus-within:ring-[3px] focus-within:ring-ring/50">
                            <span className="pl-3 text-sm whitespace-nowrap text-muted-foreground">
                                {publicBaseUrl}
                            </span>
                            <input
                                value={data.slug ?? ''}
                                onChange={(e) =>
                                    setData(
                                        'slug',
                                        e.target.value
                                            .toLowerCase()
                                            .replace(/[^a-z0-9-]/g, '-'),
                                    )
                                }
                                className="h-9 min-w-0 flex-1 bg-transparent pr-3 text-base outline-none md:text-sm"
                            />
                        </div>
                    </Field>
                )}
            </Section>

            <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 p-3 backdrop-blur md:sticky md:-mx-4 md:px-4">
                <Button
                    type="submit"
                    size="lg"
                    className="w-full md:w-auto"
                    disabled={processing}
                >
                    {processing && <Spinner />}
                    {submitLabel}
                </Button>
            </div>
        </form>
    );
}

function Section({
    title,
    description,
    children,
}: {
    title: string;
    description?: string;
    children: ReactNode;
}) {
    return (
        <section className="space-y-4 rounded-2xl border bg-card p-4">
            <header>
                <h2 className="font-semibold">{title}</h2>
                {description && (
                    <p className="text-sm text-muted-foreground">
                        {description}
                    </p>
                )}
            </header>
            {children}
        </section>
    );
}

function Field({
    label,
    htmlFor,
    error,
    children,
}: {
    label: string;
    htmlFor?: string;
    error?: string;
    children: ReactNode;
}) {
    return (
        <div className="grid gap-2">
            <Label htmlFor={htmlFor}>{label}</Label>
            {children}
            <InputError message={error} />
        </div>
    );
}

function Chip({
    active,
    disabled,
    onClick,
    children,
}: {
    active: boolean;
    disabled?: boolean;
    onClick: () => void;
    children: ReactNode;
}) {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            className={cn(
                'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-60',
                active
                    ? 'border-brand bg-brand text-white'
                    : 'border-border hover:border-brand/50',
            )}
        >
            {children}
        </button>
    );
}

function CheckField({
    id,
    checked,
    disabled,
    onChange,
    label,
    hint,
}: {
    id: string;
    checked: boolean;
    disabled?: boolean;
    onChange: (value: boolean) => void;
    label: string;
    hint?: string;
}) {
    return (
        <div className="flex items-start gap-3">
            <Checkbox
                id={id}
                checked={checked}
                disabled={disabled}
                onCheckedChange={(v) => onChange(v === true)}
                className="mt-0.5"
            />
            <div className="grid gap-0.5">
                <Label htmlFor={id}>{label}</Label>
                {hint && (
                    <p className="text-sm text-muted-foreground">{hint}</p>
                )}
            </div>
        </div>
    );
}

function TiebreakerList({
    options,
    value,
    onChange,
}: {
    options: { value: string; label: string }[];
    value: string[];
    onChange: (value: string[]) => void;
}) {
    const label = (v: string) => options.find((o) => o.value === v)?.label;
    const unused = options.filter((o) => !value.includes(o.value));

    const move = (index: number, offset: number) => {
        const next = [...value];
        [next[index], next[index + offset]] = [
            next[index + offset],
            next[index],
        ];
        onChange(next);
    };

    return (
        <ol className="divide-y rounded-xl border">
            {value.map((v, i) => (
                <li key={v} className="flex items-center gap-2 px-3 py-2">
                    <Checkbox
                        checked
                        disabled={value.length === 1}
                        onCheckedChange={() =>
                            onChange(value.filter((x) => x !== v))
                        }
                        aria-label={`Quitar ${label(v)}`}
                    />
                    <span className="w-5 text-sm font-semibold text-brand">
                        {i + 1}.
                    </span>
                    <span className="flex-1 text-sm">{label(v)}</span>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        disabled={i === 0}
                        onClick={() => move(i, -1)}
                        aria-label="Subir"
                    >
                        <ChevronUp />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        disabled={i === value.length - 1}
                        onClick={() => move(i, 1)}
                        aria-label="Bajar"
                    >
                        <ChevronDown />
                    </Button>
                </li>
            ))}
            {unused.map((o) => (
                <li
                    key={o.value}
                    className="flex items-center gap-2 px-3 py-2 text-muted-foreground"
                >
                    <Checkbox
                        checked={false}
                        onCheckedChange={() => onChange([...value, o.value])}
                        aria-label={`Usar ${o.label}`}
                    />
                    <span className="w-5" />
                    <span className="flex-1 text-sm">{o.label}</span>
                </li>
            ))}
        </ol>
    );
}
