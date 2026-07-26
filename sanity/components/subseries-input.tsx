import { useEffect, useState } from "react";
import { Box, Card, Flex, Radio, Stack, Text } from "@sanity/ui";
import { set, unset, useClient, useFormValue, type StringInputProps } from "sanity";

type Option = { _key: string; title: string };

/**
 * Champ « Groupe » d'une œuvre : liste des groupes déclarés sur SA rubrique,
 * en boutons radio. Bernard ne tape rien, il choisit, donc pas de faute de
 * frappe possible et l'ordre reste celui de la rubrique.
 *
 * La valeur stockée est le `_key` de l'entrée du tableau `subseries` de la
 * rubrique : renommer un groupe ne casse donc pas les œuvres qui le pointent.
 */
export function SubseriesInput(props: StringInputProps) {
  const { value, onChange, readOnly } = props;
  const seriesRef = useFormValue(["series"]) as { _ref?: string } | undefined;
  const client = useClient({ apiVersion: "2024-01-01" });
  const [options, setOptions] = useState<Option[] | null>(null);

  const seriesId = seriesRef?._ref;

  useEffect(() => {
    if (!seriesId) {
      setOptions([]);
      return;
    }
    let cancelled = false;
    client
      // Le brouillon d'abord : un groupe tout juste ajouté et pas encore
      // publié doit déjà être proposé.
      .fetch<Option[] | null>(
        'coalesce(*[_id == "drafts." + $id][0].subseries, *[_id == $id][0].subseries)[]{_key, title}',
        { id: seriesId },
      )
      .then((res) => {
        if (!cancelled) setOptions((res ?? []).filter((o) => o?._key && o?.title));
      })
      .catch(() => {
        if (!cancelled) setOptions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [client, seriesId]);

  if (options === null) {
    return (
      <Text size={1} muted>
        Chargement des groupes…
      </Text>
    );
  }

  if (options.length === 0) {
    return (
      <Card padding={3} radius={2} tone="transparent">
        <Text size={1} muted>
          Cette rubrique n&rsquo;a pas encore de groupes. Pour en créer, ouvrez la rubrique
          (« Modifier une rubrique ») et remplissez « Groupes d&rsquo;œuvres ».
        </Text>
      </Card>
    );
  }

  const choose = (key: string | null) => onChange(key ? set(key) : unset());

  return (
    <Stack space={2}>
      <Choice
        label="Aucun groupe"
        checked={!value}
        disabled={readOnly}
        onSelect={() => choose(null)}
      />
      {options.map((o) => (
        <Choice
          key={o._key}
          label={o.title}
          checked={value === o._key}
          disabled={readOnly}
          onSelect={() => choose(o._key)}
        />
      ))}
    </Stack>
  );
}

function Choice({
  label,
  checked,
  disabled,
  onSelect,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onSelect: () => void;
}) {
  return (
    <Card
      as="label"
      padding={3}
      radius={2}
      tone={checked ? "primary" : "transparent"}
      style={{ cursor: disabled ? "default" : "pointer" }}
    >
      <Flex align="center" gap={3}>
        <Radio checked={checked} disabled={disabled} onChange={onSelect} readOnly={disabled} />
        <Box>
          <Text size={2}>{label}</Text>
        </Box>
      </Flex>
    </Card>
  );
}
