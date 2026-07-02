import { useCallback, useState } from "react";
import { Button, Dialog, Flex, Stack, Text } from "@sanity/ui";
import { TrashIcon } from "@sanity/icons";
import { useDocumentOperation, useFormValue, type InputProps } from "sanity";

/**
 * Formulaire d'œuvre avec un bouton « Supprimer cette œuvre » visible en bas
 * de la fiche (au-dessus de la barre Publier), au lieu du seul menu « ⋯ ».
 * La barre d'actions du bas est figée par Sanity (1 bouton + menu), d'où ce
 * placement. Suppression protégée par une boîte de confirmation.
 */
export function ArtworkInputWithDelete(props: InputProps) {
  // Ne s'applique qu'au formulaire racine du document (pas aux sous-champs).
  if (props.id !== "root") return props.renderDefault(props);
  return (
    <Stack space={6}>
      {props.renderDefault(props)}
      <DeleteArtworkButton />
    </Stack>
  );
}

function DeleteArtworkButton() {
  const id = useFormValue(["_id"]) as string | undefined;
  const publishedId = id?.replace(/^drafts\./, "") ?? "";
  const { delete: deleteOp } = useDocumentOperation(publishedId, "artwork");
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const onDelete = useCallback(() => {
    setDeleting(true);
    deleteOp.execute();
    setConfirming(false);
  }, [deleteOp]);

  // Rien à supprimer (fiche pas encore créée) : pas de bouton.
  if (!id || deleteOp.disabled) return null;

  return (
    <>
      <Flex justify="flex-end">
        <Button
          icon={TrashIcon}
          text="Supprimer cette œuvre"
          tone="critical"
          mode="ghost"
          disabled={deleting}
          onClick={() => setConfirming(true)}
        />
      </Flex>
      {confirming && (
        <Dialog
          id="confirm-delete-artwork"
          header="Supprimer cette œuvre ?"
          width={1}
          onClose={() => setConfirming(false)}
          footer={
            <Flex justify="flex-end" gap={2} padding={3}>
              <Button text="Annuler" mode="ghost" onClick={() => setConfirming(false)} />
              <Button
                text="Oui, supprimer"
                tone="critical"
                icon={TrashIcon}
                onClick={onDelete}
              />
            </Flex>
          }
        >
          <Stack padding={4} space={3}>
            <Text>
              L&rsquo;œuvre et sa fiche seront retirées du site. Cette action est définitive.
            </Text>
          </Stack>
        </Dialog>
      )}
    </>
  );
}
