import { useCallback, useEffect, useState } from "react";
import { Button, Dialog, Flex, Stack, Text } from "@sanity/ui";
import { TrashIcon } from "@sanity/icons";
import { useClient, useFormValue, type InputProps } from "sanity";

/**
 * Formulaire de rubrique avec un bouton « Supprimer cette rubrique et ses
 * œuvres » en bas de la fiche. Demande de Bernard du 13/08/2026 : « comment
 * supprimer une rubrique et son contenu en un clic !!!? ». Sanity refuse de
 * supprimer une rubrique tant qu'une œuvre la référence : ce bouton supprime
 * d'abord toutes les œuvres de la rubrique (brouillons compris), puis la
 * rubrique elle-même, après une confirmation qui annonce le compte exact.
 *
 * Si une œuvre de la rubrique est utilisée ailleurs (œuvre de couverture d'une
 * autre rubrique, exposition…), la transaction échoue SANS rien supprimer et
 * le message invite à demander à Zadig : on ne force jamais.
 */
export function SeriesInputWithDelete(props: InputProps) {
  // Ne s'applique qu'au formulaire racine du document (pas aux sous-champs).
  if (props.id !== "root") return props.renderDefault(props);
  return (
    <Stack space={6}>
      {props.renderDefault(props)}
      <DeleteSeriesButton />
    </Stack>
  );
}

function DeleteSeriesButton() {
  const id = useFormValue(["_id"]) as string | undefined;
  const title = useFormValue(["title"]) as string | undefined;
  const publishedId = id?.replace(/^drafts\./, "") ?? "";
  const client = useClient({ apiVersion: "2024-01-01" });
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Compte des œuvres de la rubrique, rafraîchi à l'ouverture de la boîte.
  useEffect(() => {
    if (!confirming || !publishedId) return;
    let cancelled = false;
    client
      .fetch<number>(`count(*[_type == "artwork" && series._ref == $sid])`, {
        sid: publishedId,
      })
      .then((n) => {
        if (!cancelled) setCount(n);
      })
      .catch(() => {
        if (!cancelled) setCount(null);
      });
    return () => {
      cancelled = true;
    };
  }, [confirming, publishedId, client]);

  const onDelete = useCallback(async () => {
    if (!publishedId) return;
    setDeleting(true);
    setError(null);
    try {
      const artworkIds = await client.fetch<string[]>(
        `*[_type == "artwork" && series._ref == $sid]._id`,
        { sid: publishedId },
      );
      let tx = client.transaction();
      for (const aid of artworkIds) {
        const base = aid.replace(/^drafts\./, "");
        tx = tx.delete(base).delete(`drafts.${base}`);
      }
      tx = tx.delete(publishedId).delete(`drafts.${publishedId}`);
      await tx.commit({ visibility: "async" });
      setConfirming(false);
    } catch {
      setError(
        "La suppression a été refusée : une de ces œuvres est utilisée ailleurs sur le site (couverture d'une autre rubrique, exposition…). Rien n'a été supprimé. Demandez à Zadig de s'en occuper.",
      );
      setDeleting(false);
    }
  }, [client, publishedId]);

  if (!id) return null;

  return (
    <>
      <Flex justify="flex-end">
        <Button
          icon={TrashIcon}
          text="Supprimer cette rubrique et ses œuvres"
          tone="critical"
          mode="ghost"
          disabled={deleting}
          onClick={() => {
            setError(null);
            setConfirming(true);
          }}
        />
      </Flex>
      {confirming && (
        <Dialog
          id="confirm-delete-series"
          header="Supprimer cette rubrique ?"
          width={1}
          onClose={() => (deleting ? null : setConfirming(false))}
          footer={
            <Flex justify="flex-end" gap={2} padding={3}>
              <Button
                text="Annuler"
                mode="ghost"
                disabled={deleting}
                onClick={() => setConfirming(false)}
              />
              <Button
                text={
                  count === null
                    ? "Oui, tout supprimer"
                    : `Oui, supprimer la rubrique et ses ${count} œuvre${count > 1 ? "s" : ""}`
                }
                tone="critical"
                icon={TrashIcon}
                disabled={deleting}
                onClick={onDelete}
              />
            </Flex>
          }
        >
          <Stack padding={4} space={4}>
            <Text>
              La rubrique « {title ?? "sans titre"} »
              {count === null
                ? " et toutes ses œuvres seront supprimées"
                : count === 0
                  ? " sera supprimée (elle ne contient aucune œuvre)"
                  : ` et ses ${count} œuvre${count > 1 ? "s" : ""} seront supprimées`}
              , photos comprises. Cette action est définitive.
            </Text>
            {error && (
              <Text size={1} style={{ color: "#b91c1c" }}>
                {error}
              </Text>
            )}
          </Stack>
        </Dialog>
      )}
    </>
  );
}
