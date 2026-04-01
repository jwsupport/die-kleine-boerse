import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type Lang = "de" | "en";

export const translations = {
  de: {
    nav_sell: "Verkaufen",
    nav_myAds: "Meine Anzeigen",
    nav_signIn: "Anmelden",
    nav_signOut: "Abmelden",
    nav_admin: "Admin",

    home_headline: "Finde etwas Besonderes.",
    home_searchPlaceholder: "Artikel suchen…",
    home_locationPlaceholder: "Ort",
    home_allFilter: "Alle",
    home_noItems: "Keine Artikel gefunden",
    home_noItemsDesc: "Wir konnten keine Anzeigen zu deiner Suche finden.",
    home_footerSell: "Anzeige aufgeben",
    home_footerMessages: "Nachrichten",
    home_copyright: "Curated Marketplace Excellence.",

    categoryGrid_title: "Alle Kategorien",
    categoryGrid_from: "ab",

    categoryPage_back: "Alle Kategorien",
    categoryPage_createListing: "Anzeige aufgeben",
    categoryPage_listingFee: "Inserierungsgebühr",
    categoryPage_noListings: "Noch keine Anzeigen",
    categoryPage_noListingsDesc:
      "Sei der Erste, der etwas in dieser Kategorie anbietet — und profitiere von maximaler Sichtbarkeit.",
    categoryPage_listNow: "Jetzt inserieren",

    myAds_title: "Meine Anzeigen",
    myAds_newListing: "Neue Anzeige",
    myAds_slotsLabel: "Anzeigen-Slots",
    myAds_of: "von",
    myAds_slotsUsage: "Du nutzt {n} von deinen {max} freien Slots.",
    myAds_slotsMaxReached: "Du hast dein Limit von 200 aktiven Anzeigen erreicht.",
    myAds_noListings: "Noch keine Anzeigen.",
    myAds_noListingsDesc: "Erstelle deine erste Anzeige, um loszulegen.",
    myAds_listing: "Anzeige",
    myAds_listings: "Anzeigen",
    myAds_boost: "Boosten",
    myAds_expired: "Abgelaufen",
    myAds_premium: "Premium",
    myAds_active: "Aktiv",
    myAds_expires: "Läuft ab",

    create_pageTitle: "Anzeige aufgeben",
    create_pageSubtitle: "Kostenlos inserieren — 10 Tage aktiv. Upgrade auf Premium für 30 Tage.",
    create_titleLabel: "Titel der Anzeige",
    create_titlePlaceholder: "z.B. Design Klassiker Sessel",
    create_priceLabel: "Preis (€)",
    create_categoryLabel: "Kategorie",
    create_categorySelect: "Auswählen…",
    create_locationLabel: "Ort",
    create_locationPlaceholder: "z.B. Berlin Mitte",
    create_negotiable: "Preis verhandelbar (VB)",
    create_descriptionLabel: "Beschreibung",
    create_descriptionPlaceholder:
      "Erzähle die Geschichte dieses Objekts — Zustand, Maße, Besonderheiten…",
    create_submit: "Anzeige jetzt schalten",
    create_cancel: "Abbrechen",
    create_required: "Pflichtfelder fehlen",
    create_requiredDesc: "Bitte fülle alle Pflichtfelder aus.",
    create_success: "Anzeige veröffentlicht!",
    create_successDesc: "Deine Anzeige ist jetzt live.",
    create_error: "Fehler",
    create_errorDesc: "Anzeige konnte nicht erstellt werden.",
    create_feeLabel: "Inserierungsgebühr",
    create_freeListing: "Kostenlos",
    create_freeValid: "10 Tage aktiv",
    create_paidValid: "30 Tage aktiv nach Zahlung",
    create_checkoutError: "Fehler beim Checkout",
    create_summary: "Zusammenfassung",

    messages_conversations: "Gespräche",
    messages_placeholder: "Nachricht schreiben…",
    messages_noConversations: "Keine Gespräche",
    messages_noConversationsDesc: "Schreibe einen Verkäufer über eine Anzeige an.",
    messages_selectConversation: "Wähle ein Gespräch aus.",

    profile_listings: "Anzeigen",
    profile_reviews: "Bewertungen",
    profile_writeReview: "Bewertung schreiben",
    profile_submitReview: "Abschicken",
    profile_noListings: "Keine Anzeigen",
    profile_noReviews: "Noch keine Bewertungen",
    profile_ratingComment: "Kommentar (optional)",
    profile_cancel: "Abbrechen",
    profile_selectRating: "Bitte wähle eine Bewertung aus.",
    profile_ratingSuccess: "Bewertung abgeschickt",
    profile_ratingThanks: "Danke für dein Feedback.",
    profile_ratingError: "Fehler",
    profile_ratingErrorDesc: "Bewertung konnte nicht gespeichert werden.",
    profile_memberSince: "Mitglied seit",

    detail_contact: "Verkäufer kontaktieren",
    detail_messagePlaceholder: "Deine Nachricht…",
    detail_send: "Senden",
    detail_similar: "Ähnliche Artikel",
    detail_report: "Melden",
    detail_reportPlaceholder: "Grund der Meldung…",
    detail_reportSubmit: "Meldung absenden",
    detail_negotiable: "VB",
    detail_notFound: "Anzeige nicht gefunden",
    detail_notFoundDesc: "Diese Anzeige existiert nicht oder wurde gelöscht.",
    detail_location: "Standort",
    detail_category: "Kategorie",
    detail_posted: "Veröffentlicht",
    detail_loginToMessage: "Bitte melde dich an, um Nachrichten zu senden.",
    detail_messageSent: "Nachricht gesendet",
    detail_messageSentDesc: "Deine Nachricht wurde übermittelt.",
    detail_reportSent: "Meldung abgeschickt",
    detail_reportSentDesc: "Wir werden die Anzeige prüfen.",
    detail_paymentSuccess: "Zahlung erfolgreich!",
    detail_paymentSuccessDesc: "Deine Anzeige ist jetzt live und für 30 Tage aktiv.",

    uploader_gallery: "Galerie",
    uploader_addUrl: "URL",
    uploader_placeholder: "https://… Bild-URL einfügen",
    uploader_add: "Hinzufügen",
    uploader_hint: "Hochauflösende Bilder bevorzugt — bessere Sichtbarkeit in Suchergebnissen.",
    uploader_removeAlt: "Bild entfernen",
    uploader_error: "Fehler",

    admin_noAccess: "Kein Zugriff",
    admin_noAccessDesc: "Diese Seite ist nur für autorisierte Administratoren zugänglich.",

    pay_step: "Bezahlung",
    pay_title: "Krypto-Zahlung",
    pay_subtitle: "Sende den genauen Betrag an eine der folgenden Adressen und klicke anschließend auf \"Ich habe bezahlt\".",
    pay_listing: "Anzeige",
    pay_amountDue: "Zu bezahlender Betrag",
    pay_listingFee: "Einmalgebühr für Premium-Listing",
    pay_warning: "Sende ausschließlich USDT (TRC-20) oder SOL an die jeweilige Adresse. Falsch gesendete Beträge können nicht zurückerstattet werden.",
    pay_instructions: "Nach der Bestätigung wird deine Anzeige manuell geprüft und innerhalb von 24 Stunden freigeschaltet.",
    pay_confirm: "Ich habe bezahlt",
    pay_confirmNote: "Du bestätigst hiermit, dass du die Zahlung abgeschlossen hast.",
    pay_successTitle: "Zahlung bestätigt",
    pay_successDesc: "Deine Zahlung wurde erfasst und deine Anzeige wird innerhalb von 24 Stunden geprüft und aktiviert.",
    pay_viewListing: "Anzeige ansehen",
    pay_error: "Fehler beim Bestätigen der Zahlung. Bitte versuche es erneut.",
  },
  en: {
    nav_sell: "Sell",
    nav_myAds: "My Ads",
    nav_signIn: "Sign in",
    nav_signOut: "Sign out",
    nav_admin: "Admin",

    home_headline: "Find something special.",
    home_searchPlaceholder: "Search items…",
    home_locationPlaceholder: "Location",
    home_allFilter: "All",
    home_noItems: "No items found",
    home_noItemsDesc: "We couldn't find any listings matching your search.",
    home_footerSell: "Sell an item",
    home_footerMessages: "Messages",
    home_copyright: "Curated Marketplace Excellence.",

    categoryGrid_title: "All Categories",
    categoryGrid_from: "from",

    categoryPage_back: "All Categories",
    categoryPage_createListing: "Create Listing",
    categoryPage_listingFee: "Listing fee",
    categoryPage_noListings: "No listings yet",
    categoryPage_noListingsDesc:
      "Be the first to list something in this category — and benefit from maximum visibility.",
    categoryPage_listNow: "List now",

    myAds_title: "My Ads",
    myAds_newListing: "New listing",
    myAds_slotsLabel: "Listing slots",
    myAds_of: "of",
    myAds_slotsUsage: "You are using {n} of your {max} free slots.",
    myAds_slotsMaxReached: "You have reached your limit of 200 active listings.",
    myAds_noListings: "No listings yet.",
    myAds_noListingsDesc: "Create your first listing to get started.",
    myAds_listing: "listing",
    myAds_listings: "listings",
    myAds_boost: "Boost",
    myAds_expired: "Expired",
    myAds_premium: "Premium",
    myAds_active: "Active",
    myAds_expires: "Expires",

    create_pageTitle: "Create Listing",
    create_pageSubtitle: "List for free — active for 10 days. Upgrade to Premium for 30 days.",
    create_titleLabel: "Listing Title",
    create_titlePlaceholder: "e.g. Design Classic Armchair",
    create_priceLabel: "Price (€)",
    create_categoryLabel: "Category",
    create_categorySelect: "Select…",
    create_locationLabel: "Location",
    create_locationPlaceholder: "e.g. Berlin Mitte",
    create_negotiable: "Price negotiable",
    create_descriptionLabel: "Description",
    create_descriptionPlaceholder:
      "Describe your item — condition, dimensions, special features…",
    create_submit: "Publish Listing",
    create_cancel: "Cancel",
    create_required: "Required fields missing",
    create_requiredDesc: "Please fill in all required fields.",
    create_success: "Listing published!",
    create_successDesc: "Your listing is now live.",
    create_error: "Error",
    create_errorDesc: "Could not create listing.",
    create_feeLabel: "Listing fee",
    create_freeListing: "Free",
    create_freeValid: "Active for 10 days",
    create_paidValid: "Active for 30 days after payment",
    create_checkoutError: "Checkout error",
    create_summary: "Summary",

    messages_conversations: "Conversations",
    messages_placeholder: "Write a message…",
    messages_noConversations: "No conversations",
    messages_noConversationsDesc: "Start a conversation through a listing.",
    messages_selectConversation: "Select a conversation.",

    profile_listings: "Listings",
    profile_reviews: "Reviews",
    profile_writeReview: "Write a review",
    profile_submitReview: "Submit",
    profile_noListings: "No listings",
    profile_noReviews: "No reviews yet",
    profile_ratingComment: "Comment (optional)",
    profile_cancel: "Cancel",
    profile_selectRating: "Please select a rating.",
    profile_ratingSuccess: "Rating submitted",
    profile_ratingThanks: "Thank you for your feedback.",
    profile_ratingError: "Error",
    profile_ratingErrorDesc: "Could not submit rating.",
    profile_memberSince: "Member since",

    detail_contact: "Contact Seller",
    detail_messagePlaceholder: "Your message…",
    detail_send: "Send",
    detail_similar: "Similar Items",
    detail_report: "Report",
    detail_reportPlaceholder: "Reason for report…",
    detail_reportSubmit: "Submit Report",
    detail_negotiable: "neg.",
    detail_notFound: "Listing not found",
    detail_notFoundDesc: "This listing doesn't exist or has been removed.",
    detail_location: "Location",
    detail_category: "Category",
    detail_posted: "Posted",
    detail_loginToMessage: "Please sign in to send messages.",
    detail_messageSent: "Message sent",
    detail_messageSentDesc: "Your message has been delivered.",
    detail_reportSent: "Report submitted",
    detail_reportSentDesc: "We will review this listing.",
    detail_paymentSuccess: "Payment successful!",
    detail_paymentSuccessDesc: "Your listing is now live and active for 30 days.",

    uploader_gallery: "Gallery",
    uploader_addUrl: "URL",
    uploader_placeholder: "https://… paste image URL",
    uploader_add: "Add",
    uploader_hint: "High-resolution images preferred — better visibility in search results.",
    uploader_removeAlt: "Remove image",
    uploader_error: "Error",

    admin_noAccess: "No Access",
    admin_noAccessDesc: "This page is only accessible to authorized administrators.",

    pay_step: "Payment",
    pay_title: "Crypto Payment",
    pay_subtitle: "Send the exact amount to one of the addresses below, then click \"I have paid\".",
    pay_listing: "Listing",
    pay_amountDue: "Amount Due",
    pay_listingFee: "One-time premium listing fee",
    pay_warning: "Send only USDT (TRC-20) or SOL to the respective address. Incorrectly sent amounts cannot be refunded.",
    pay_instructions: "After confirmation, your listing will be manually reviewed and activated within 24 hours.",
    pay_confirm: "I have paid",
    pay_confirmNote: "By clicking you confirm that you have completed the payment.",
    pay_successTitle: "Payment Confirmed",
    pay_successDesc: "Your payment has been recorded and your listing will be reviewed and activated within 24 hours.",
    pay_viewListing: "View Listing",
    pay_error: "Error confirming payment. Please try again.",
  },
} as const;

export type Translations = typeof translations.de;

interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
}

const LangContext = createContext<LangContextValue>({ lang: "de", setLang: () => {} });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      const stored = localStorage.getItem("kb_lang");
      if (stored === "de" || stored === "en") return stored;
    } catch {}
    return "de";
  });

  const setLang = (l: Lang) => {
    setLangState(l);
    try { localStorage.setItem("kb_lang", l); } catch {}
  };

  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>;
}

export function useLanguage() {
  return useContext(LangContext);
}

export function useT(): Translations {
  const { lang } = useLanguage();
  return translations[lang] as Translations;
}
