export const homeCopy = {
  hero: {
    title: "L'art d'offrir,\nla magie de la surprise.",
    subtitle:
      "Lancez une cagnotte privée, invitez votre entourage à contribuer, et révélez la surprise quand vous êtes prêt.",
    primaryCta: "Créer une surprise",
    secondaryCta: "Comment ça marche",
    reassurance: [
      "Sans inscription pour contribuer",
      "Paiement sécurisé via Stripe",
      "Contributions discrètes"
    ] as const,
    preview: {
      eyebrow: "Surprise en préparation",
      title: "Anniversaire de Léa",
      status: "Privé",
      totalLabel: "Cagnotte en cours",
      totalValue: "360 €",
      badge: "Surprise",
      messageTitle: "Messages doux",
      messageBody: "“On participe avec joie. Hâte de voir sa réaction.”",
      privacyTitle: "Contributions discrètes",
      privacyBody: "Les montants individuels restent invisibles pour le groupe."
    }
  },
  quickTrust: {
    title: "Simple, discret, rassurant",
    items: [
      "Aucune inscription nécessaire pour participer",
      "Paiement sécurisé",
      "Expérience pensée pour une rapidité d'éxécution"
    ] as const
  },
  steps: {
    title: "Comment ça marche",
    items: [
      {
        title: "Créez",
        text: "Créez votre cagnotte en quelques minutes.",
        icon: "01"
      },
      {
        title: "Partagez",
        text: "Invitez vos proches avec un simple lien.",
        icon: "02"
      },
      {
        title: "Collectez",
        text: "Chacun contribue discrètement et laisse un message.",
        icon: "03"
      },
      {
        title: "Offrez",
        text: "Récupérez la cagnotte et révélez la surprise.",
        icon: "04"
      }
    ] as const
  },
  differentiators: {
    title: "PotSecret réinvente la cagnotte pour en faire un moment à part.",
    items: [
      {
        title: "Contributions discrètes",
        text: "Les montants ne sont pas visibles entre participants.",
        icon: "◌"
      },
      {
        title: "Partage ultra simple",
        text: "Un lien suffit pour inviter tout le monde.",
        icon: "↗"
      },
      {
        title: "Paiement sécurisé",
        text: "Contribution rapide via Stripe.",
        icon: "✓"
      }
    ] as const
  },
  occasions: {
    title: "Pour toutes les belles occasions",
    items: [
      "🎂 Anniversaire",
      "🎁 Départ",
      "👶 Naissance",
      "💍 Mariage",
      "🎉 Surprise",
      "👥 Pot d’équipe"
    ] as const
  },
  extendedTrust: {
    title: "Une expérience simple du début à la fin",
    items: [
      "Création en quelques minutes",
      "Contribution rapide sans compte",
      "Paiement sécurisé",
      "Discrétion respectée"
    ] as const
  },
  finalCta: {
    title: "Prêt à surprendre quelqu'un ?",
    button: "Créer ma surprise",
    subtitle: "Ça prend moins de 2 minutes à configurer."
  }
} as const;
