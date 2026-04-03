const FR_COPY = {
  common: {
    siteName: "PotSecret",
    logoAlt: "Logo PotSecret",
    accountFallback: "Compte PotSecret",
    noDescription: "Aucune description pour ce pot.",
    noGoal: "Aucun objectif",
    noGoalDetailed: "Aucun objectif financier n'a été défini.",
    dateUnknown: "Non renseignée"
  },
  meta: {
    title: "PotSecret - Cagnotte surprise et discrète",
    description: "Organisez une cagnotte discrète pour un anniversaire, un départ ou une naissance.",
    keywords: ["PotSecret", "cagnotte", "cagnotte surprise", "anniversaire", "départ", "naissance"] as const
  },
  nav: {
    tagline: "La cagnotte qui surprend",
    home: "Accueil",
    health: "Health",
    dashboard: "Dashboard",
    login: "Se connecter",
    signup: "Inscription",
    signOut: "Déconnexion"
  },
  footer: {
    baseline: "Cagnotte surprise et discrète",
    legal: "Mentions légales",
    contact: "Contact",
    terms: "Conditions"
  },
  brand: {
    name: "PotSecret",
    tagline: "La cagnotte qui surprend"
  },
  hero: {
    title: "L'art d'offrir, la magie de la surprise.",
    subtitle:
      "Lancez une cagnotte privée, invitez votre entourage à contribuer, et révélez la surprise quand vous êtes prêt.",
    ctaPrimary: "Créer une surprise",
    ctaSecondary: "Comment ça marche"
  },
  trust: {
    items: ["Paiement sécurisé", "Confidentialité totale", "Création en 1 minute"]
  },
  steps: {
    title: "Comment ça marche",
    list: [
      {
        title: "Créez",
        desc: "Une cagnotte secrète pour toute occasion"
      },
      {
        title: "Partagez",
        desc: "Le lien avec vos proches"
      },
      {
        title: "Contribuez",
        desc: "En toute discrétion"
      },
      {
        title: "Surprenez",
        desc: "En révélant la surprise"
      }
    ]
  },
  value: {
    title: "Pourquoi PotSecret change tout",
    points: [
      "Aucun montant visible entre participants",
      "Effet surprise garanti",
      "Une expérience plus humaine et émotionnelle",
      "Zéro malaise lié aux contributions"
    ]
  },
  emotion: {
    title: "Ce qui compte, ce n’est pas le montant",
    subtitle: "C’est l’émotion au moment de la découverte."
  },
  ctaFinal: {
    title: "Créer une surprise qui compte vraiment",
    button: "Commencer"
  },
  faq: [
    {
      q: "Les montants sont-ils visibles ?",
      a: "Non. Chaque participation reste strictement confidentielle."
    },
    {
      q: "Est-ce sécurisé ?",
      a: "Oui, les paiements sont entièrement sécurisés."
    },
    {
      q: "Combien de temps pour créer une cagnotte ?",
      a: "Moins d’une minute."
    }
  ],
  buttons: {
    retry: "Réessayer",
    backHome: "Retour à l'accueil",
    backDashboard: "Retour au dashboard",
    copy: "Copier",
    copied: "Lien copié",
    seeDetails: "Voir le détail",
    saveChanges: "Enregistrer les modifications",
    updating: "Mise à jour...",
    closePot: "Clôturer le pot",
    archivePot: "Archiver le pot",
    createPot: "Créer une surprise",
    createFund: "Créer la cagnotte",
    creating: "Création...",
    continueToPayment: "Continuer vers le paiement",
    unavailablePot: "Pot indisponible",
    redirecting: "Redirection...",
    backToPot: "Revenir au pot",
    resumeContribution: "Reprendre ma contribution",
    createAccess: "Créer mon accès",
    loginLink: "Se connecter",
    receiveLoginLink: "Recevoir mon lien de connexion",
    receiveSignupLink: "Recevoir mon lien d'inscription",
    sending: "Envoi...",
    dedicatedView: "Vue dédiée",
    createMyPot: "Créer mon pot"
  },
  states: {
    loading: "Chargement en cours...",
    ok: "OK",
    error: "Erreur"
  },
  validation: {
    pot: {
      missingPot: "Pot introuvable.",
      titleMin: "Le titre doit contenir au moins 3 caractères.",
      titleMax: "Le titre est trop long.",
      descriptionMax: "La description est trop longue.",
      invalidEventDate: "La date d'événement est invalide.",
      goalInteger: "L'objectif doit être un nombre entier.",
      goalPositive: "L'objectif doit être supérieur à zéro."
    }
  },
  errors: {
    globalTitle: "Une erreur est survenue",
    globalBody: "L'opération n'a pas pu se terminer correctement. Vous pouvez réessayer ou revenir à une page sûre.",
    notFoundTitle: "Page introuvable",
    notFoundBody: "Le lien demandé n'existe pas, a expiré ou n'est pas accessible avec votre session actuelle.",
    invalidEmail: "Saisissez une adresse email valide.",
    signupDisabled: "L'inscription par email n'est pas encore activée dans Supabase.",
    rateLimit: "Trop de tentatives. Attendez un instant avant de renvoyer un lien.",
    userNotFound: "Aucun compte correspondant n'a été trouvé pour cet email.",
    loginLinkSendFailed: "Impossible d'envoyer le lien de connexion pour le moment.",
    signupLinkSendFailed: "Impossible d'envoyer le lien d'inscription pour le moment.",
    authLinkInvalid: "Le lien de connexion est invalide ou a expiré.",
    authFinalizeFailed: "Impossible de finaliser la connexion. Réessayez.",
    createPotFailed: "Impossible de créer ce pot.",
    sessionExpiredCreatePot: "Votre session a expiré. Reconnectez-vous pour créer un pot.",
    sanitizedTitleInvalid: "Le titre du pot reste invalide après nettoyage.",
    sanitizedTitleField: "Le titre doit rester lisible et contenir au moins 3 caractères.",
    createPotPersistenceFailed: "La création du pot a échoué. Vérifiez la configuration Supabase et réessayez.",
    updatePotFailed: "Impossible de mettre à jour ce pot.",
    sessionExpiredContinue: "Votre session a expiré. Reconnectez-vous pour continuer.",
    verifyPotStateFailed: "Impossible de vérifier l'état actuel du pot.",
    currencyLocked: "La devise ne peut plus être modifiée après la première contribution confirmée.",
    updatePersistenceFailed: "La mise à jour a échoué. Vérifiez la configuration Supabase et réessayez.",
    invalidAction: "Action invalide.",
    sessionExpired: "Session expirée.",
    updateStatusFailed: "Impossible de mettre à jour le statut du pot.",
    invalidShareLink: "Lien de partage invalide.",
    invalidAmount: "Saisissez un montant valide.",
    minimumAmount: "Le montant minimum est de 1.",
    maximumAmount: "Le montant maximum est de 10 000.",
    displayNameTooLong: "Le nom affiché est trop long.",
    messageTooLong: "Le message est trop long.",
    consentRequired: "Confirmez que vous souhaitez préparer cette contribution.",
    invalidContribution: "Contribution invalide.",
    potUnavailable: "Ce pot n'accepte plus de contributions.",
    stripeSessionFailed: "La session de paiement n'a pas pu être créée. Réessayez dans un instant.",
    contributionPrepareFailed: "Impossible de préparer votre contribution pour le paiement. Réessayez.",
    stripeUrlMissing: "Stripe n'a pas retourné d'URL de paiement.",
    missingStripeSession: "Aucune session Stripe n'a été fournie pour vérifier le paiement.",
    stripeSessionVerificationFailed: "Impossible de vérifier cette session Stripe."
  },
  success: {
    loginLinkSent: "Lien de connexion envoyé. Vérifiez votre boîte mail.",
    signupLinkSent: "Lien d'inscription envoyé. Vérifiez votre boîte mail.",
    potUpdated: "Les informations du pot ont été mises à jour.",
    paymentReceived: "Paiement reçu",
    verificationPending: "Confirmation en cours",
    verificationFailed: "Vérification impossible"
  },
  home: {
    badge: "Cagnotte surprise et discrète",
    title: "L'art d'offrir, la magie de la surprise.",
    subtitle: "Lancez une cagnotte privée, invitez votre entourage à contribuer, et révélez la surprise quand vous êtes prêt.",
    reassurance: "Simple à partager · Mobile-friendly · Contributions discrètes",
    ctaPrimary: "Créez une surprise",
    ctaSecondary: "Comment ça marche",
    example: {
      eyebrow: "Exemple de cagnotte",
      title: "Cadeau surprise pour un anniversaire",
      description: "Une page simple pour centraliser les participations, garder les montants individuels discrets et recueillir de jolis messages.",
      status: "Privé",
      totalLabel: "Total collecté",
      totalValue: "360 € / 500 €",
      participantsLabel: "Participants",
      participantsValue: "18",
      messageLabel: "Message",
      messageValue: "“On participe avec plaisir. Hâte de voir sa réaction.”"
    },
    benefitsHeading: "Bénéfices",
    benefitsTitle: "Une cagnotte pensée pour rester simple et crédible",
    benefits: [
      {
        icon: "◉",
        title: "Contributions discrètes",
        description: "Les montants individuels restent discrets pour préserver l'effet de surprise."
      },
      {
        icon: "✦",
        title: "Création rapide",
        description: "Créez votre pot en quelques minutes et partagez-le aussitôt avec votre entourage."
      },
      {
        icon: "→",
        title: "Parcours fluide",
        description: "Les participants contribuent simplement en ligne, depuis mobile ou ordinateur."
      }
    ],
    howItWorksHeading: "Comment ça marche",
    howItWorksTitle: "Un parcours simple en trois étapes",
    howItWorks: [
      {
        step: "01",
        title: "Créez votre pot",
        description: "Renseignez le titre, l'événement et vos préférences de confidentialité."
      },
      {
        step: "02",
        title: "Partagez le lien",
        description: "Envoyez le lien privé aux bonnes personnes en quelques secondes."
      },
      {
        step: "03",
        title: "Recevez les contributions",
        description: "La cagnotte se remplit simplement, sans exposer les détails individuels."
      }
    ]
  },
  signature: {
    text: "PotSecret réinvente la cagnotte pour en faire un moment à part."
  },
  health: {
    title: "Health",
    heading: "PotSecret répond",
    body: "Cette page sert de vérification simple pour confirmer que l'application Next.js est bien joignable."
  },
  auth: {
    loginPage: {
      title: "Connexion organisateur",
      description: "Entrez votre email pour recevoir un lien magique Supabase.",
      noAccount: "Pas encore de compte ?"
    },
    signupPage: {
      title: "Créer un compte",
      description: "Entrez votre email pour recevoir un lien magique et activer votre accès organisateur.",
      hasAccount: "Déjà inscrit ?"
    },
    form: {
      emailLabel: "Email",
      emailPlaceholder: "organisateur@potsecret.app"
    }
  },
  dashboard: {
    home: {
      eyebrow: "Dashboard privé",
      greeting: "Bonjour",
      description: "Retrouvez l'ensemble de vos pots, triés par date de création, et pilotez leur confidentialité depuis un seul espace.",
      kpis: {
        pots: { label: "Pots", hint: "Tous vos pots sont classés du plus récent au plus ancien." },
        openPots: { label: "Pots ouverts", hint: "Nombre de pots encore ouverts aux nouvelles contributions." },
        contributions: { label: "Contributions", hint: "Nombre total de contributions confirmées recueillies." },
        currencies: { label: "Devises", hint: "Nombre de devises actuellement utilisées dans vos pots." }
      },
      listTitle: "Tous mes pots",
      listSubtitle: "Tri simple par date de création décroissante."
    },
    pots: {
      eyebrow: "Dashboard organisateur",
      title: "Mes pots",
      description: "Retrouvez vos cagnottes, leurs badges de statut et leur total validé, triés du plus récent au plus ancien.",
      new: {
        eyebrow: "Nouveau pot",
        title: "Créer une cagnotte",
        description: "Configurez votre pot, laissez Supabase générer le lien de partage sécurisé, puis partagez-le avec vos participants.",
        back: "Retour à mes pots"
      },
      detail: {
        back: "Retour à mes pots",
        infoTitle: "Informations et réglages",
        infoDescription: "Modifiez le pot, sa confidentialité et l'affichage final des messages depuis ce panneau.",
        shareLinkLabel: "Lien de partage public",
        ownerPrivacyTitle: "Confidentialité organisateur",
        contributionsTitle: "Contributions",
        contributionsDescription: "Les détails individuels s'adaptent automatiquement au mode de confidentialité choisi.",
        noContributions: "Aucune contribution confirmée pour le moment.",
        totalOnlyNotice: "Ce pot est en mode total_only. L'interface n'affiche volontairement ni montant individuel ni identité.",
        strictSecretNotice: "Ce pot est en mode strict_secret. L'interface n'affiche volontairement aucun détail individuel, même pour l'organisateur.",
        contributionHeader: "Contribution",
        amountHeader: "Montant",
        dateHeader: "Date",
        anonymousParticipant: "Participant anonyme",
        masked: "Masqué",
        messagesTitle: "Messages",
        messagesDescription: "Les messages restent visibles pour vous selon la confidentialité et l'anonymat choisi.",
        beneficiaryDisplay: "Affichage au bénéficiaire final",
        beneficiaryActive: "actif",
        beneficiaryInactive: "désactivé",
        noMessages: "Aucun message disponible pour ce pot pour le moment.",
        maskedAuthor: "Auteur masqué",
        labels: {
          validTotal: "Total validé",
          validTotalHint: "Seuls les paiements confirmés sont pris en compte.",
          confirmedContributions: "Contributions confirmées",
          confirmedContributionsHint: "Le détail individuel reste filtré selon la confidentialité du pot.",
          goal: "Objectif",
          eventDate: "Date d'événement",
          privacy: "Confidentialité appliquée",
          goalField: "Objectif",
          beneficiaryMessages: "Messages au bénéficiaire"
        },
        goalReached: {
          noGoal: "Sans objectif",
          reached: "Atteint",
          inProgress: "En cours"
        },
        beneficiaryMessagesState: {
          active: "Actifs",
          hidden: "Masqués"
        }
      }
    }
  },
  potList: {
    emptyTitle: "Aucun pot pour le moment.",
    emptyDescription: "Commencez par créer votre première cagnotte surprise.",
    createdOn: "Créé le",
    publicLink: "Lien public",
    validTotal: "Total validé",
    confirmedContributions: "contributions confirmées"
  },
  potForm: {
    currencies: ["EUR", "USD", "GBP"] as const,
    fields: {
      title: { label: "Titre", placeholder: "Anniversaire surprise de Léa" },
      description: { label: "Description", placeholder: "Quelques mots pour guider les participants." },
      eventType: {
        label: "Type d'événement",
        options: {
          birthday: "Anniversaire",
          farewell: "Départ",
          birth: "Naissance",
          wedding: "Mariage",
          other: "Autre"
        }
      },
      eventDate: { label: "Date de l'événement" },
      currency: { label: "Devise" },
      goalAmount: {
        label: "Objectif optionnel",
        placeholder: "300",
        hint: "Saisissez un montant entier, par exemple 300 pour 300 EUR."
      },
      privacyMode: {
        label: "Mode de confidentialité",
        options: {
          totalOnly: "Montants masqués pour tout le monde, seul le total est visible",
          standard: "Mode owner_can_see_amounts : montants visibles par l'organisateur",
          blindToOwner: "Mode strict_secret : montants et identités masqués même pour l'organisateur"
        }
      },
      beneficiaryMessages: "Autoriser l'affichage des messages au bénéficiaire final lorsque vous partagerez le résultat."
    },
    submit: "Créer le pot",
    pending: "Création..."
  },
  publicPot: {
    defaultDescription: "Une cagnotte discrète pour contribuer en douceur à une belle surprise.",
    cards: {
      validTotal: {
        label: "Total validé",
        hint: "Seuls les paiements confirmés sont inclus dans ce total."
      },
      eventDate: {
        label: "Date de l'événement",
        hint: "Le pot reste simple à partager, même à la dernière minute."
      },
      goal: {
        label: "Objectif",
        noGoal: "Aucun objectif précisé",
        noGoalHint: "Chaque participation compte.",
        progressSuffix: "% de l'objectif atteint."
      },
      privacy: {
        label: "Confidentialité",
        hint: "Les montants individuels des autres participants ne sont jamais affichés ici."
      }
    },
    progressLabel: "Progression vers l'objectif",
    contributionIntro: {
      title: "Une contribution simple et discrète",
      cards: [
        {
          title: "Montants protégés",
          description: "Vous ne voyez jamais le détail des autres participations."
        },
        {
          title: "Message libre",
          description: "Ajoutez un mot personnel, avec ou sans nom affiché."
        },
        {
          title: "Paiement à venir",
          description: "Vous serez redirigé vers Stripe Checkout pour finaliser un paiement one-shot sécurisé."
        }
      ]
    },
    participate: {
      title: "Participer au pot",
      description: "Renseignez votre contribution puis finalisez le paiement sur la page Stripe sécurisée.",
      unavailable: "Ce pot n'est pas ouvert aux nouvelles contributions pour le moment."
    }
  },
  contributionForm: {
    amountLabel: "Montant",
    amountHintPrefix: "Le montant sera préparé dans la devise du pot, ici en",
    amountPlaceholder: "30",
    displayNameLabel: "Prénom ou nom affiché (optionnel)",
    displayNamePlaceholder: "Camille",
    messageLabel: "Message (optionnel)",
    messagePlaceholder: "Un mot doux pour accompagner la surprise.",
    anonymous: "Contribuer anonymement. Si cette case est cochée, votre nom ne sera pas associé au message.",
    consent: "Je confirme vouloir continuer vers le paiement sécurisé Stripe pour cette contribution."
  },
  publicPotSuccess: {
    titlePrefix: "Merci pour votre contribution à",
    statusMessage: {
      confirmed: "Votre paiement a bien été confirmé et la contribution est maintenant prise en compte dans le pot.",
      paidPending: "Le paiement a été autorisé. La confirmation finale du pot peut prendre quelques secondes.",
      unpaid: "Le paiement n'est pas encore confirmé. Si vous venez de payer, rechargez cette page dans un instant."
    },
    potLabel: "Pot concerné",
    amountLabel: "Montant",
    unavailableAmount: "Montant indisponible",
    anonymousContribution: "Votre contribution est marquée comme anonyme.",
    displayedNamePrefix: "Nom affiché",
    noDisplayedName: "Aucun nom affiché n'a été renseigné.",
    stripeReference: "Référence Stripe"
  },
  publicPotCancel: {
    badge: "Contribution interrompue",
    titlePrefix: "Rien n'a été validé pour",
    body: "Vous pouvez revenir au pot et reprendre la préparation de votre contribution quand vous le souhaitez.",
    info: "Aucun paiement n'a été lancé et aucun montant confirmé n'a été ajouté au total du pot."
  }
} as const;
export const COPY = {
  fr: FR_COPY,
  en: FR_COPY
} as const;

export type CopyLanguage = keyof typeof COPY;
export type AppCopy = (typeof COPY)[CopyLanguage];
