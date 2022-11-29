import React, { useCallback } from "react";
import { Intl } from "redux-intl";
import {
  Button,
  Modal,
  Spinner,
  Divider,
  Typography,
  Box,
  Tooltip,
  Icon,
} from "@hero-design/react";
import styled from "styled-components";
import { useSelector, useDispatch } from "react-redux";
import { useApi } from "@ehrocks/api";
import { useTheme } from "hero-theme/hooks";
import { themeGet } from "hero-theme/utils";

import { atsPermissionsSelector } from "../../apiCalls/jobs/atsPermissions";
import { currentCandidateSelector } from "../../data/currentCandidate";
import {
  genRedirectUrl,
  genGetAuthorizationUrlConfigs,
  PROVIDERS,
} from "../../apiCalls/mailIntegrations/getAuthorizationUrl";
import { genConnectEhMailConfigs } from "../../apiCalls/mailIntegrations/connectEhMail";
import { getMailIntegrationsAC } from "../../apiCalls/mailIntegrations/get";
import {
  useEventTracking,
  TRACK_CLOSE_EMAIL_INTEGRATION_MODAL,
  TRACK_CONNECT_EH_ACCOUNT,
} from "../../tracks";
import MSSignInButton from "../../assets/images/ms_signin_button.png";
import GoogleSignInButton from "../../assets/images/google_signin_button.png";
import Header from "../../assets/images/mail_integration_modal_header.svg";

const PopUpModalBodyContainer = styled.div`
  display: flex;
`;

const PopUpModalBodyTextWrapper = styled.div`
  flex: 1;
`;

const TitleSpacing = styled.div`
  margin-bottom: ${themeGet("space.medium")}px;
`;

const StyledCloseButton = styled(Modal.CloseButton)`
  cursor: ${({ disabled }) =>
    disabled ? "not-allowed" : "pointer"} !important;
  color: ${({ disabled, theme }) =>
    disabled
      ? theme.colors.palette.greyLight45
      : theme.colors.disabledText} !important;
`;

const SignInButton = styled.img`
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  opacity: ${(props) => (props.disabled ? "0.5" : "1")};
`;

const noop = () => {};

const MailIntegrationModal = ({
  onClose,
  isDisqualifying,
  selectedCandidates,
}) => {
  const theme = useTheme();
  const track = useEventTracking();
  const dispatch = useDispatch();
  const currentCandidate = useSelector(currentCandidateSelector);
  const atsPermissions = useSelector(atsPermissionsSelector);
  const redirectUrl = genRedirectUrl({
    candidateId: currentCandidate.id,
    candidateEmail: currentCandidate.applied_email,
    isDisqualifying,
    selectedCandidates,
  });
  const onCompleteFetchingAuthorizationUrl = (data) => {
    const authorizationUrl = data?.data?.authorization_url;
    if (authorizationUrl) {
      window.location.assign(authorizationUrl);
    }
  };
  const {
    fetchData: fetchGmailAuthorizationUrl,
    loading: isFetchingGmailAuthorizationUrl,
  } = useApi(
    genGetAuthorizationUrlConfigs(
      PROVIDERS.GOOGLE,
      { redirectUrl },
      onCompleteFetchingAuthorizationUrl
    )
  );
  const {
    fetchData: fetchMicrosoftAuthorizationUrl,
    loading: isFetchingMicrosoftAuthorizationUrl,
  } = useApi(
    genGetAuthorizationUrlConfigs(
      PROVIDERS.MICROSOFT,
      { redirectUrl },
      onCompleteFetchingAuthorizationUrl
    )
  );

  const onCompleteConnectEhMail = () => {
    track(TRACK_CONNECT_EH_ACCOUNT);
    dispatch(getMailIntegrationsAC());
    onClose();
  };

  const { fetchData: connectEhMail, loading: isConnectingEhMail } = useApi(
    genConnectEhMailConfigs({ onComplete: onCompleteConnectEhMail })
  );

  const handleCloseModal = useCallback(() => {
    onClose();
    track(TRACK_CLOSE_EMAIL_INTEGRATION_MODAL);
  }, [onClose, track]);
  const isFetchingAuthorizationUrl =
    isFetchingGmailAuthorizationUrl ||
    isFetchingMicrosoftAuthorizationUrl ||
    isConnectingEhMail;

  const gmailIntegrationEnabled = atsPermissions?.gmail_integration_enabled;
  const m365IntegrationEnabled = atsPermissions?.m365_integration_enabled;
  const nonIntegratedCommsEnabled = atsPermissions?.non_integrated_comms;
  const showButtonsDivider = nonIntegratedCommsEnabled;

  return (
    <Modal open size="medium">
      <Spinner loading={isFetchingAuthorizationUrl}>
        <div
          style={{
            position: "relative",
            padding: theme.space.medium,
            borderTopLeftRadius: theme.radii.medium,
            borderTopRightRadius: theme.radii.medium,
            backgroundColor: theme.colors.palette.pinkLight90,
          }}
        >
          <img
            src={Header}
            alt="Mail Integration Modal Header"
            style={{
              width: 200,
              margin: "auto",
              display: "block",
            }}
          />

          <StyledCloseButton
            style={{
              position: "absolute",
              right: theme.space.medium,
              top: theme.space.medium,
            }}
            onClick={isFetchingAuthorizationUrl ? noop : handleCloseModal}
            disabled={isFetchingAuthorizationUrl}
          />
        </div>

        <Modal.Body>
          <PopUpModalBodyContainer>
            <PopUpModalBodyTextWrapper>
              <>
                <Typography.Title level={5}>
                  {Intl.formatMessage({
                    id: "ats.mailIntegration.modal.title",
                  })}
                </Typography.Title>
                <TitleSpacing />
              </>
              <Typography.Text>
                {Intl.formatMessage({ id: "ats.mailIntegration.modal.body" })}
              </Typography.Text>
              {gmailIntegrationEnabled && (
                <>
                  <br />
                  <Typography.Text fontSize={12} intent="subdued">
                    {Intl.formatHTMLMessage(
                      { id: "ats.mailIntegration.modal.disclosure" },
                      {
                        link: (
                          <Button.Link
                            href="https://developers.google.com/terms/api-services-user-data-policy#additional_requirements_for_specific_api_scopes"
                            text={Intl.formatMessage({
                              id: "ats.mailIntegration.modal.link",
                            })}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                              fontSize: "small",
                            }}
                          />
                        ),
                      }
                    )}
                  </Typography.Text>
                </>
              )}
            </PopUpModalBodyTextWrapper>
          </PopUpModalBodyContainer>
        </Modal.Body>
        <Divider marginX="large" />
        <Modal.Footer
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {nonIntegratedCommsEnabled && (
            <Box
              style={{
                display: "flex",
                alignItems: "center",
              }}
            >
              <Button
                text={Intl.formatMessage({
                  id: "ats.mailIntegration.modal.button.nonIntegratedComms",
                })}
                onClick={() => connectEhMail()}
              />
              <Tooltip
                content={Intl.formatMessage({
                  id: "ats.mailIntegration.modal.nonIntegratedComms.tooltipMessage",
                })}
                target={
                  <Icon
                    icon="circle-info-outlined"
                    size="large"
                    sx={{ ml: "small" }}
                    data-test-id="ncc-button-info"
                  />
                }
              />
            </Box>
          )}
          {showButtonsDivider && (
            <Typography.Text sx={{ mt: "xsmall", mb: "xsmall" }}>
              {Intl.formatMessage({ id: "or" })}
            </Typography.Text>
          )}
          <Box>
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {gmailIntegrationEnabled && (
                <SignInButton
                  src={GoogleSignInButton}
                  alt="Google Sign In Button"
                  style={{ width: 200, marginRight: theme.space.small }}
                  onClick={() => fetchGmailAuthorizationUrl()}
                />
              )}
              <SignInButton
                src={MSSignInButton}
                alt="Microsoft Sign In Button"
                style={{ width: 200 }}
                disabled={!m365IntegrationEnabled}
                onClick={() => {
                  if (m365IntegrationEnabled) {
                    fetchMicrosoftAuthorizationUrl();
                  }
                }}
              />
            </Box>
            {!m365IntegrationEnabled && (
              <Box>
                <Typography.Text
                  intent="subdued"
                  style={{ fontSize: theme.fontSizes.xsmall }}
                >
                  {Intl.formatHTMLMessage(
                    { id: "ats.mailIntegration.noticeMessage" },
                    {
                      link: (
                        <Button.Link
                          href={
                            "https://employmenthero.zendesk.com/hc/en-au/articles/4807217965583-HR-Platform-Managing-your-Microsoft-Outlook-and-recruitment-module-integration-"
                          }
                          text={Intl.formatMessage({
                            id: "ats.mailIntegration.link",
                          })}
                          target="_blank"
                          style={{ fontSize: theme.fontSizes.xsmall }}
                        />
                      ),
                    }
                  )}
                </Typography.Text>
              </Box>
            )}
          </Box>
        </Modal.Footer>
      </Spinner>
    </Modal>
  );
};

export default MailIntegrationModal;
const a = 5;
