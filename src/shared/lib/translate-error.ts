const ERROR_MESSAGES_FR: Record<string, string> = {
  // agency
  AGENCY_NOT_FOUND: "Agence introuvable.",
  MEMBER_ALREADY_EXISTS: "Un membre avec cet e-mail fait déjà partie de cette agence.",
  INSUFFICIENT_PERMISSIONS: "Vous n'avez pas la permission d'effectuer cette action.",
  INVALID_INVITE_TOKEN: "Le lien d'invitation est invalide ou a expiré.",
  MEMBER_NOT_FOUND: "Ce membre est introuvable dans cette agence.",
  INVALID_AGENCY_NAME: "Le nom de l'agence ne peut pas être vide.",
  INVALID_AGENCY_SLUG:
    "L'identifiant de l'agence ne doit contenir que des lettres minuscules, des chiffres et des tirets.",
  AGENCY_SLUG_TAKEN: "Cet identifiant d'agence est déjà utilisé.",
  INVALID_THEME_NAME: "Le nom de la thématique ne peut pas être vide.",
  THEME_NAME_TOO_LONG: "Le nom de la thématique ne doit pas dépasser 100 caractères.",
  THEME_NOT_FOUND: "Thématique introuvable.",
  INVALID_TAG_NAME: "Le nom du tag ne peut pas être vide.",
  TAG_NAME_TOO_LONG: "Le nom du tag ne doit pas dépasser 50 caractères.",
  TAG_NOT_FOUND: "Tag introuvable.",
  INVALID_AGENCY_CONTEXT_SECTOR: "Le secteur d'activité ne peut pas être vide.",
  AGENCY_CONTEXT_SECTOR_TOO_LONG: "Le secteur d'activité ne doit pas dépasser 200 caractères.",
  INVALID_AGENCY_CONTEXT_AUDIENCE: "La cible ne peut pas être vide.",
  AGENCY_CONTEXT_AUDIENCE_TOO_LONG: "La cible ne doit pas dépasser 500 caractères.",
  INVALID_AGENCY_CONTEXT_TONE: "Le ton éditorial ne peut pas être vide.",
  AGENCY_CONTEXT_TONE_TOO_LONG: "Le ton éditorial ne doit pas dépasser 200 caractères.",
  INVALID_AGENCY_MEMBER_ROLE: "Rôle de membre invalide.",
  // auth
  INVALID_EMAIL: "Adresse e-mail invalide.",
  INVALID_USER_ROLE: "Rôle utilisateur invalide.",
  INVALID_USER_NAME: "Le nom d'utilisateur ne peut pas être vide.",
  USER_ALREADY_EXISTS: "Un compte existe déjà avec cet e-mail.",
  // content
  INVALID_ARTICLE_TITLE: "Le titre de l'article ne peut pas être vide.",
  ARTICLE_ALREADY_PUBLISHED: "Impossible de modifier un article déjà publié.",
  INVALID_STATUS_TRANSITION: "Transition de statut invalide.",
  BODY_PURGE_NOT_ELIGIBLE: "Cet article n'est pas encore éligible à la purge du contenu.",
  ARTICLE_BODY_PURGED:
    "Le contenu de cet article a été purgé selon la politique de rétention et ne peut plus être exporté.",
  ARTICLE_NOT_FOUND: "Article introuvable.",
  NO_CURATED_SOURCES:
    "Aucune source retenue. Marquez des articles « À utiliser » dans le flux de curation avant de continuer.",
  INVALID_CONTENT_TYPE: "Type de contenu invalide.",
  INVALID_CONTENT_STATUS: "Statut de contenu invalide.",
  INVALID_LANGUAGE: "Langue invalide.",
  INVALID_EXPORT_FORMAT: "Format d'export invalide.",
  INVALID_SLUG: "Ce slug n'est pas valide.",
  SEO_TITLE_TOO_LONG: "Le titre SEO dépasse la longueur maximale autorisée.",
  SEO_DESCRIPTION_TOO_LONG: "La méta-description dépasse la longueur maximale autorisée.",
  SEO_EXCERPT_TOO_LONG: "L'extrait dépasse la longueur maximale autorisée.",
  // rss
  INVALID_FEED_URL: "Cette URL de flux RSS n'est pas valide.",
  INVALID_CURATION_STATUS: "Statut de curation invalide.",
  FEED_ITEM_NOT_FOUND: "Élément du flux introuvable.",
};

const DEFAULT_ERROR_MESSAGE_FR = "Une erreur est survenue. Veuillez réessayer.";

/** Frontière Server Action uniquement — ne jamais importer dans domain/application. */
export function translateError(error: { code?: string; message?: string }): string {
  return (error.code && ERROR_MESSAGES_FR[error.code]) || DEFAULT_ERROR_MESSAGE_FR;
}
